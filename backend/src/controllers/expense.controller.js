import { prisma } from '../config/database.js';
import { sendSuccess, sendError, sendValidationError, sendNotFound, sendForbidden, sendConflict } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as notificationService from '../services/notification.service.js';

/**
 * Expense Controller - handles expense operations
 */

// Add a new expense
const addExpense = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { groupId, title, amount, description, date } = req.body;

  // Validate inputs
  if (!groupId || !title || !amount) {
    return sendValidationError(res, 'Group ID, title, and amount are required');
  }

  if (amount <= 0) {
    return sendValidationError(res, 'Amount must be greater than 0');
  }

  if (title.trim().length < 2) {
    return sendValidationError(res, 'Title must be at least 2 characters long');
  }

  try {
    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership) {
      return sendForbidden(res, 'You are not a member of this group');
    }

    // Get all group members (should be exactly 2 for MVP)
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            expoPushToken: true
          }
        }
      }
    });

    if (groupMembers.length !== 2) {
      return sendError(res, 'Group must have exactly 2 members to add expenses', 400);
    }

    // Calculate share amount (split equally)
    const shareAmount = Math.round((amount / 2) * 100) / 100; // Round to 2 decimal places

    // Create expense and shares in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create expense
      const expense = await tx.expense.create({
        data: {
          groupId,
          addedById: userId,
          title: title.trim(),
          description: description?.trim() || null,
          amount: parseFloat(amount),
          date: date ? new Date(date) : new Date()
        },
        include: {
          addedBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Create expense shares
      const shares = await Promise.all(
        groupMembers.map(member =>
          tx.expenseShare.create({
            data: {
              expenseId: expense.id,
              userId: member.userId,
              shareAmount,
              isPaid: member.userId === userId // The person who added expense is considered to have paid their share
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          })
        )
      );

      return { expense, shares };
    });

    // Send notification to the other member
    const otherMember = groupMembers.find(member => member.userId !== userId);
    if (otherMember && otherMember.user.expoPushToken) {
      await notificationService.notifyExpenseAdded(
        otherMember.user,
        result.expense.addedBy,
        result.expense
      );
    }

    const responseData = {
      ...result.expense,
      shares: result.shares
    };

    return sendSuccess(res, responseData, 201, 'Expense added successfully');
  } catch (error) {
    console.error('Error adding expense:', error);
    return sendError(res, 'Failed to add expense', 500);
  }
});

// Get expenses for a group
const getGroupExpenses = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { groupId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;

  if (!groupId) {
    return sendValidationError(res, 'Group ID is required');
  }

  try {
    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership) {
      return sendForbidden(res, 'You are not a member of this group');
    }

    // Build where clause
    const whereClause = { groupId };
    
    if (status === 'paid') {
      whereClause.shares = {
        every: { isPaid: true }
      };
    } else if (status === 'unpaid') {
      whereClause.shares = {
        some: { isPaid: false }
      };
    }

    // Get pagination info
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get expenses and total count
    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where: whereClause,
        include: {
          addedBy: {
            select: {
              id: true,
              name: true
            }
          },
          shares: {
            where: { userId },
            select: {
              id: true,
              shareAmount: true,
              isPaid: true,
              paidAt: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take
      }),
      prisma.expense.count({ where: whereClause })
    ]);

    // Format response
    const formattedExpenses = expenses.map(expense => {
      const myShare = expense.shares[0] || { shareAmount: 0, isPaid: false };
      const isSettled = expense.shares.every(share => share.isPaid);

      return {
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        createdAt: expense.createdAt,
        addedBy: expense.addedBy,
        myShare,
        isSettled
      };
    });

    const responseData = {
      expenses: formattedExpenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    return sendSuccess(res, responseData, 200, 'Expenses retrieved successfully');
  } catch (error) {
    console.error('Error fetching group expenses:', error);
    return sendError(res, 'Failed to fetch expenses', 500);
  }
});

// Get single expense details
const getExpense = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { expenseId } = req.params;

  if (!expenseId) {
    return sendValidationError(res, 'Expense ID is required');
  }

  try {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true
          }
        },
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            },
            payment: {
              select: {
                id: true,
                status: true,
                upiApp: true,
                initiatedAt: true,
                confirmedAt: true
              }
            }
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!expense) {
      return sendNotFound(res, 'Expense not found');
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: expense.groupId,
          userId
        }
      }
    });

    if (!membership) {
      return sendForbidden(res, 'You are not a member of this group');
    }

    return sendSuccess(res, expense, 200, 'Expense details retrieved');
  } catch (error) {
    console.error('Error fetching expense details:', error);
    return sendError(res, 'Failed to fetch expense details', 500);
  }
});

// Delete an expense
const deleteExpense = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { expenseId } = req.params;

  if (!expenseId) {
    return sendValidationError(res, 'Expense ID is required');
  }

  try {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!expense) {
      return sendNotFound(res, 'Expense not found');
    }

    // Check if user added this expense
    if (expense.addedById !== userId) {
      return sendForbidden(res, 'You can only delete expenses you added');
    }

    // Check if any shares have been paid by other users
    const otherUserPaidShares = expense.shares.filter(
      share => share.userId !== userId && share.isPaid
    );

    if (otherUserPaidShares.length > 0) {
      return sendConflict(res, 'Cannot delete expense with payments from other users');
    }

    // Delete expense and shares in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete any payments for this expense
      await tx.payment.deleteMany({
        where: {
          share: {
            expenseId
          }
        }
      });

      // Delete expense shares
      await tx.expenseShare.deleteMany({
        where: { expenseId }
      });

      // Delete expense
      await tx.expense.delete({
        where: { id: expenseId }
      });
    });

    // Send notification to other members
    const otherMembers = expense.shares.filter(share => share.userId !== userId);
    for (const member of otherMembers) {
      const user = await prisma.user.findUnique({
        where: { id: member.userId },
        select: { expoPushToken: true, name: true }
      });

      if (user?.expoPushToken) {
        const addedByUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        });

        await notificationService.notifyExpenseDeleted(
          user,
          addedByUser,
          expense.title
        );
      }
    }

    return sendSuccess(res, null, 200, 'Expense deleted successfully');
  } catch (error) {
    console.error('Error deleting expense:', error);
    return sendError(res, 'Failed to delete expense', 500);
  }
});

// Update an expense (only description and date)
const updateExpense = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { expenseId } = req.params;
  const { description, date } = req.body;

  if (!expenseId) {
    return sendValidationError(res, 'Expense ID is required');
  }

  try {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return sendNotFound(res, 'Expense not found');
    }

    // Check if user added this expense
    if (expense.addedById !== userId) {
      return sendForbidden(res, 'You can only update expenses you added');
    }

    // Build update data
    const updateData = {};
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (date !== undefined) {
      updateData.date = new Date(date);
    }

    if (Object.keys(updateData).length === 0) {
      return sendValidationError(res, 'No valid fields to update');
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
      include: {
        addedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return sendSuccess(res, updatedExpense, 200, 'Expense updated successfully');
  } catch (error) {
    console.error('Error updating expense:', error);
    return sendError(res, 'Failed to update expense', 500);
  }
});

export {
  addExpense,
  getGroupExpenses,
  getExpense,
  deleteExpense,
  updateExpense
};

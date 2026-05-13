import { prisma } from '../config/database.js';
import { sendSuccess, sendError, sendValidationError, sendNotFound } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateUpiId, extractUpiId } from '../services/upi.service.js';

/**
 * User Controller - handles user profile operations
 */

// Get current user profile
const getMe = asyncHandler(async (req, res) => {
  const userId = req.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mobile: true,
        name: true,
        upiId: true,
        expoPushToken: true,
        createdAt: true
      }
    });

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    return sendSuccess(res, user, 200, 'User profile retrieved');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return sendError(res, 'Failed to fetch user profile', 500);
  }
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name, upiId } = req.body;

  // Validate inputs
  const updateData = {};
  
  if (name !== undefined) {
    if (!name || name.trim().length < 2) {
      return sendValidationError(res, 'Name must be at least 2 characters long');
    }
    updateData.name = name.trim();
  }

  if (upiId !== undefined) {
    if (upiId) {
      const extractedUpiId = extractUpiId(upiId);
      if (!extractedUpiId || !validateUpiId(extractedUpiId)) {
        return sendValidationError(res, 'Invalid UPI ID format');
      }
      updateData.upiId = extractedUpiId;
    } else {
      updateData.upiId = null;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return sendValidationError(res, 'No valid fields to update');
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        mobile: true,
        name: true,
        upiId: true,
        expoPushToken: true,
        createdAt: true
      }
    });

    return sendSuccess(res, updatedUser, 200, 'Profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    return sendError(res, 'Failed to update profile', 500);
  }
});

// Update Expo push token
const updatePushToken = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { expoPushToken } = req.body;

  if (!expoPushToken || typeof expoPushToken !== 'string') {
    return sendValidationError(res, 'Valid Expo push token is required');
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken }
    });

    return sendSuccess(res, null, 200, 'Push token updated successfully');
  } catch (error) {
    console.error('Error updating push token:', error);
    return sendError(res, 'Failed to update push token', 500);
  }
});

// Delete user account (soft delete by marking as inactive)
// Note: In a real app, you might want to implement proper account deletion with data cleanup
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.userId;

  try {
    // Check if user has any active expenses or payments
    const activeExpenses = await prisma.expenseShare.count({
      where: {
        userId: userId,
        isPaid: false,
        expense: {
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }
    });

    if (activeExpenses > 0) {
      return sendError(res, 'Cannot delete account with active expenses', 400);
    }

    // Remove all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    // Clear sensitive data
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: null,
        upiId: null,
        expoPushToken: null
      }
    });

    return sendSuccess(res, null, 200, 'Account deleted successfully');
  } catch (error) {
    console.error('Error deleting account:', error);
    return sendError(res, 'Failed to delete account', 500);
  }
});

// Get user statistics
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.userId;

  try {
    // Get user's groups
    const userGroups = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true }
    });

    const groupIds = userGroups.map(gm => gm.groupId);

    if (groupIds.length === 0) {
      return sendSuccess(res, {
        totalGroups: 0,
        totalExpenses: 0,
        totalAmount: 0,
        youOwe: 0,
        theyOwe: 0
      }, 200, 'User statistics retrieved');
    }

    // Get expense statistics
    const expenses = await prisma.expense.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        shares: {
          where: { userId }
        }
      }
    });

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate balances
    const youOwe = expenses.reduce((sum, expense) => {
      const myShare = expense.shares.find(share => !share.isPaid);
      return sum + (myShare ? myShare.shareAmount : 0);
    }, 0);

    const theyOwe = expenses.reduce((sum, expense) => {
      const myShare = expense.shares.find(share => share.isPaid && share.userId === userId);
      if (myShare) {
        const otherShare = expense.shares.find(share => share.userId !== userId && !share.isPaid);
        return sum + (otherShare ? otherShare.shareAmount : 0);
      }
      return sum;
    }, 0);

    const stats = {
      totalGroups: groupIds.length,
      totalExpenses,
      totalAmount,
      youOwe,
      theyOwe
    };

    return sendSuccess(res, stats, 200, 'User statistics retrieved');
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return sendError(res, 'Failed to fetch user statistics', 500);
  }
});

export {
  getMe,
  updateProfile,
  updatePushToken,
  deleteAccount,
  getUserStats
};

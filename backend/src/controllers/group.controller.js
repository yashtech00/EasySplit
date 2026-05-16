import { prisma } from '../config/database.js';
import { sendSuccess, sendError, sendValidationError, sendNotFound, sendConflict, sendForbidden } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as notificationService from '../services/notification.service.js';

/**
 * Group Controller - handles group operations
 */

// Generate random invite code
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'GRP-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create a new group
const createGroup = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name } = req.body;

  if (!name || name.trim().length < 2) {
    return sendValidationError(res, 'Group name must be at least 2 characters long');
  }

  try {
    // Generate unique invite code
    let inviteCode;
    let codeExists = true;
    let attempts = 0;
    
    while (codeExists && attempts < 10) {
      inviteCode = generateInviteCode();
      codeExists = await prisma.group.findUnique({
        where: { inviteCode }
      });
      attempts++;
    }

    if (codeExists) {
      return sendError(res, 'Failed to generate unique invite code', 500);
    }

    // Create group
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        inviteCode,
        members: {
          create: {
            userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true
              }
            }
          }
        }
      }
    });

    return sendSuccess(res, group, 201, 'Group created successfully');
  } catch (error) {
    console.error('Error creating group:', error);
    return sendError(res, 'Failed to create group', 500);
  }
});

// Join an existing group using invite code
const joinGroup = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { inviteCode } = req.body;

  if (!inviteCode || typeof inviteCode !== 'string') {
    return sendValidationError(res, 'Valid invite code is required');
  }

  try {
    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
                upiId: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return sendNotFound(res, 'Invalid invite code');
    }

    // Check if user is already a member
    const existingMember = group.members.find(member => member.userId === userId);
    if (existingMember) {
      return sendConflict(res, 'You are already a member of this group');
    }

    // Check if group has reached maximum members (2 for MVP)
    if (group.members.length >= 2) {
      return sendConflict(res, 'Group is already full (maximum 2 members)');
    }

    // Add user to group
    const updatedGroup = await prisma.group.update({
      where: { id: group.id },
      data: {
        members: {
          create: {
            userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
                upiId: true
              }
            }
          }
        }
      }
    });

    // Send notification to existing member(s)
    const existingMembers = group.members.filter(member => member.userId !== userId);
    const newUser = updatedGroup.members.find(member => member.userId === userId);

    for (const member of existingMembers) {
      if (member.user.expoPushToken) {
        await notificationService.notifyGroupJoined(
          member.user,
          newUser.user,
          group.name
        );
      }
    }

    return sendSuccess(res, updatedGroup, 200, 'Joined group successfully');
  } catch (error) {
    console.error('Error joining group:', error);
    return sendError(res, 'Failed to join group', 500);
  }
});

// Get group details
const getGroup = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { groupId } = req.params;

  if (!groupId) {
    return sendValidationError(res, 'Group ID is required');
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
                upiId: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return sendNotFound(res, 'Group not found');
    }

    // Check if user is a member
    const isMember = group.members.some(member => member.userId === userId);
    if (!isMember) {
      return sendForbidden(res, 'You are not a member of this group');
    }

    return sendSuccess(res, group, 200, 'Group details retrieved');
  } catch (error) {
    console.error('Error fetching group details:', error);
    return sendError(res, 'Failed to fetch group details', 500);
  }
});

// Get group balance
const getBalance = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { groupId } = req.params;

  if (!groupId) {
    return sendValidationError(res, 'Group ID is required');
  }

  try {
    // Check if user is a member
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

    // Get all unpaid expense shares for this group
    const unpaidShares = await prisma.expenseShare.findMany({
      where: {
        expense: { groupId },
        isPaid: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        expense: {
          select: {
            amount: true
          }
        }
      }
    });

    // Calculate balances
    const youOwe = unpaidShares
      .filter(share => share.userId === userId)
      .reduce((sum, share) => sum + share.shareAmount, 0);

    const theyOwe = unpaidShares
      .filter(share => share.userId !== userId)
      .reduce((sum, share) => sum + share.shareAmount, 0);

    // Get total group spend
    const totalExpenses = await prisma.expense.findMany({
      where: { groupId },
      select: { amount: true }
    });

    const totalGroupSpend = totalExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const yourShare = totalGroupSpend / 2;
    const theirShare = totalGroupSpend / 2;

    // Determine net balance direction
    let netBalance = {
      direction: 'SETTLED',
      amount: 0,
      person: null
    };

    const net = theyOwe - youOwe;
    if (net > 0) {
      const otherPerson = unpaidShares.find(share => share.userId !== userId)?.user;
      netBalance = {
        direction: 'THEY_OWE_YOU',
        amount: net,
        person: otherPerson || { id: '', name: 'Unknown' }
      };
    } else if (net < 0) {
      const otherPerson = unpaidShares.find(share => share.userId === userId)?.user;
      netBalance = {
        direction: 'YOU_OWE_THEM',
        amount: Math.abs(net),
        person: otherPerson || { id: '', name: 'Unknown' }
      };
    }

    const balanceData = {
      totalGroupSpend,
      yourShare,
      theirShare,
      netBalance
    };

    return sendSuccess(res, balanceData, 200, 'Group balance retrieved');
  } catch (error) {
    console.error('Error fetching group balance:', error);
    return sendError(res, 'Failed to fetch group balance', 500);
  }
});

// Send payment reminder
const sendReminder = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { groupId } = req.params;
  const { targetUserId } = req.body;

  if (!groupId || !targetUserId) {
    return sendValidationError(res, 'Group ID and target user ID are required');
  }

  if (targetUserId === userId) {
    return sendValidationError(res, 'Cannot send reminder to yourself');
  }

  try {
    // Check if user is a member
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

    // Check if target user is also a member
    const targetMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId
        }
      },
      include: {
        user: true
      }
    });

    if (!targetMembership) {
      return sendNotFound(res, 'Target user is not a member of this group');
    }

    // Check cooldown (24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReminder = await prisma.reminder.findFirst({
      where: {
        groupId,
        sentByUserId: userId,
        sentToUserId: targetUserId,
        sentAt: {
          gte: oneDayAgo
        }
      }
    });

    if (recentReminder) {
      return sendError(res, 'Reminder already sent in the last 24 hours', 429);
    }

    // Get amount owed
    const unpaidShares = await prisma.expenseShare.findMany({
      where: {
        userId: targetUserId,
        isPaid: false,
        expense: { groupId }
      },
      include: {
        expense: {
          select: {
            title: true,
            amount: true
          }
        }
      }
    });

    if (unpaidShares.length === 0) {
      return sendError(res, 'No outstanding payments to remind about', 400);
    }

    const totalOwed = unpaidShares.reduce((sum, share) => sum + share.shareAmount, 0);
    const expenseTitle = unpaidShares.length === 1 
      ? unpaidShares[0].expense.title 
      : `${unpaidShares.length} expenses`;

    // Create reminder record
    await prisma.reminder.create({
      data: {
        groupId,
        sentByUserId: userId,
        sentToUserId: targetUserId
      }
    });

    // Send notification
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    await notificationService.notifyReminder(
      targetMembership.user,
      currentUser,
      totalOwed,
      expenseTitle
    );

    return sendSuccess(res, null, 200, 'Reminder sent successfully');
  } catch (error) {
    console.error('Error sending reminder:', error);
    return sendError(res, 'Failed to send reminder', 500);
  }
});

// Get user's groups
const getMyGroups = asyncHandler(async (req, res) => {
  const userId = req.userId;

  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    mobile: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const groups = memberships.map(m => ({
      ...m.group,
      membersCount: m.group.members.length
    }));

    return sendSuccess(res, groups, 200, 'User groups retrieved');
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return sendError(res, 'Failed to fetch user groups', 500);
  }
});

export {
  createGroup,
  joinGroup,
  getGroup,
  getBalance,
  sendReminder,
  getMyGroups
};

import { prisma } from '../config/database.js';
import { sendSuccess, sendError, sendValidationError, sendNotFound, sendConflict } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generateUpiLinks, generateTransactionRef, parseTransactionRef } from '../services/upi.service.js';
import * as notificationService from '../services/notification.service.js';

/**
 * Payment Controller - handles payment operations
 */

// Initiate a payment for an expense share
const initiatePayment = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { shareId } = req.body;

  if (!shareId) {
    return sendValidationError(res, 'Share ID is required');
  }

  try {
    // Get expense share with related data
    const share = await prisma.expenseShare.findUnique({
      where: { id: shareId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            upiId: true
          }
        },
        expense: {
          include: {
            addedBy: {
              select: {
                id: true,
                name: true,
                upiId: true
              }
            },
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        payment: true
      }
    });

    if (!share) {
      return sendNotFound(res, 'Expense share not found');
    }

    // Check if share belongs to current user
    if (share.userId !== userId) {
      return sendError(res, 'This share does not belong to you', 403);
    }

    // Check if share is already paid
    if (share.isPaid) {
      return sendConflict(res, 'This share is already paid');
    }

    // Check if payee has UPI ID
    const payee = share.expense.addedBy;
    if (!payee.upiId) {
      return sendError(res, 'Payee has not set up UPI ID', 400);
    }

    // Check if payment already exists
    if (share.payment) {
      // If payment exists but is not paid, return existing payment info
      const payment = share.payment;
      
      const transactionRef = generateTransactionRef(shareId);
      const note = `${share.expense.title} - SplitEasy`;
      
      const upiLinks = generateUpiLinks({
        payeeUpiId: payee.upiId,
        payeeName: payee.name,
        amount: share.shareAmount,
        note,
        ref: transactionRef
      });

      const responseData = {
        paymentId: payment.id,
        shareAmount: share.shareAmount,
        payee: {
          id: payee.id,
          name: payee.name,
          upiId: payee.upiId
        },
        upiLinks,
        transactionRef,
        expense: {
          id: share.expense.id,
          title: share.expense.title,
          amount: share.expense.amount
        }
      };

      return sendSuccess(res, responseData, 200, 'Existing payment session resumed');
    }

    // Get payer information
    const payer = share.user;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        shareId,
        payerId: userId,
        payeeId: payee.id,
        amount: share.shareAmount,
        status: 'INITIATED'
      }
    });

    // Generate UPI links
    const transactionRef = generateTransactionRef(shareId);
    const note = `${share.expense.title} - SplitEasy`;
    
    const upiLinks = generateUpiLinks({
      payeeUpiId: payee.upiId,
      payeeName: payee.name,
      amount: share.shareAmount,
      note,
      ref: transactionRef
    });

    const responseData = {
      paymentId: payment.id,
      shareAmount: share.shareAmount,
      payee: {
        id: payee.id,
        name: payee.name,
        upiId: payee.upiId
      },
      upiLinks,
      transactionRef,
      expense: {
        id: share.expense.id,
        title: share.expense.title,
        amount: share.expense.amount
      }
    };

    return sendSuccess(res, responseData, 201, 'Payment initiated successfully');
  } catch (error) {
    console.error('Error initiating payment:', error);
    return sendError(res, 'Failed to initiate payment', 500);
  }
});

// Record which UPI app the user selected
const recordUpiApp = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { paymentId } = req.params;
  const { upiApp } = req.body;

  if (!paymentId || !upiApp) {
    return sendValidationError(res, 'Payment ID and UPI app are required');
  }

  const validApps = ['gpay', 'paytm', 'phonepe', 'bhim'];
  if (!validApps.includes(upiApp)) {
    return sendValidationError(res, 'Invalid UPI app');
  }

  try {
    // Get payment and verify ownership
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        share: {
          include: {
            user: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!payment) {
      return sendNotFound(res, 'Payment not found');
    }

    // Check if payment belongs to current user
    if (payment.payerId !== userId) {
      return sendError(res, 'This payment does not belong to you', 403);
    }

    // Update payment with selected UPI app
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { upiApp }
    });

    return sendSuccess(res, updatedPayment, 200, 'UPI app recorded successfully');
  } catch (error) {
    console.error('Error recording UPI app:', error);
    return sendError(res, 'Failed to record UPI app', 500);
  }
});

// Confirm payment after returning from UPI app
const confirmPayment = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { paymentId } = req.params;
  const { status } = req.body;

  if (!paymentId || !status) {
    return sendValidationError(res, 'Payment ID and status are required');
  }

  if (!['CONFIRMED', 'FAILED'].includes(status)) {
    return sendValidationError(res, 'Invalid payment status');
  }

  try {
    // Get payment with related data
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        share: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                expoPushToken: true
              }
            },
            expense: {
              include: {
                addedBy: {
                  select: {
                    id: true,
                    name: true,
                    expoPushToken: true
                  }
                }
              }
            }
          }
        },
        payer: {
          select: {
            id: true,
            name: true
          }
        },
        payee: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!payment) {
      return sendNotFound(res, 'Payment not found');
    }

    // Check if payment belongs to current user
    if (payment.payerId !== userId) {
      return sendError(res, 'This payment does not belong to you', 403);
    }

    // Check if payment is already confirmed
    if (payment.status === 'CONFIRMED') {
      return sendConflict(res, 'Payment is already confirmed');
    }

    // Update payment and share in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status,
          confirmedAt: status === 'CONFIRMED' ? new Date() : null
        }
      });

      // If confirmed, update expense share
      if (status === 'CONFIRMED') {
        await tx.expenseShare.update({
          where: { id: payment.shareId },
          data: {
            isPaid: true,
            paidAt: new Date()
          }
        });
      }

      return updatedPayment;
    });

    // If payment is confirmed, send notification to payee
    if (status === 'CONFIRMED') {
      await notificationService.notifyPaymentReceived(
        payment.payee,
        payment.payer,
        payment.amount,
        payment.share.expense.title
      );
    }

    const responseData = {
      paymentId: result.id,
      status: result.status,
      paidAt: result.confirmedAt,
      shareId: payment.shareId
    };

    return sendSuccess(res, responseData, 200, `Payment ${status.toLowerCase()} successfully`);
  } catch (error) {
    console.error('Error confirming payment:', error);
    return sendError(res, 'Failed to confirm payment', 500);
  }
});

// Get payment status
const getPayment = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { paymentId } = req.params;

  if (!paymentId) {
    return sendValidationError(res, 'Payment ID is required');
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        share: {
          include: {
            expense: {
              select: {
                id: true,
                title: true,
                amount: true
              }
            }
          }
        },
        payer: {
          select: {
            id: true,
            name: true
          }
        },
        payee: {
          select: {
            id: true,
            name: true,
            upiId: true
          }
        }
      }
    });

    if (!payment) {
      return sendNotFound(res, 'Payment not found');
    }

    // Check if user is involved in this payment
    if (payment.payerId !== userId && payment.payeeId !== userId) {
      return sendError(res, 'You are not authorized to view this payment', 403);
    }

    return sendSuccess(res, payment, 200, 'Payment details retrieved');
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return sendError(res, 'Failed to fetch payment details', 500);
  }
});

// Get user's payment history
const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 20 } = req.query;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get payments where user is either payer or payee
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where: {
          OR: [
            { payerId: userId },
            { payeeId: userId }
          ]
        },
        include: {
          share: {
            include: {
              expense: {
                select: {
                  id: true,
                  title: true,
                  amount: true
                }
              }
            }
          },
          payer: {
            select: {
              id: true,
              name: true
            }
          },
          payee: {
            select: {
              id: true,
              name: true,
              upiId: true
            }
          }
        },
        orderBy: { initiatedAt: 'desc' },
        skip,
        take
      }),
      prisma.payment.count({
        where: {
          OR: [
            { payerId: userId },
            { payeeId: userId }
          ]
        }
      })
    ]);

    const responseData = {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    return sendSuccess(res, responseData, 200, 'Payment history retrieved');
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return sendError(res, 'Failed to fetch payment history', 500);
  }
});

export {
  initiatePayment,
  recordUpiApp,
  confirmPayment,
  getPayment,
  getPaymentHistory
};

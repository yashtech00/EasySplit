import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = express.Router();

/**
 * Payment Routes - All routes require authentication
 */

// Initiate a payment for an expense share
router.post('/initiate', authenticate, paymentController.initiatePayment);

// Record which UPI app the user selected
router.patch('/:paymentId/app', authenticate, paymentController.recordUpiApp);

// Confirm payment after returning from UPI app
router.patch('/:paymentId/confirm', authenticate, paymentController.confirmPayment);

// Get payment status/details
router.get('/:paymentId', authenticate, paymentController.getPayment);

// Get user's payment history
router.get('/history/me', authenticate, paymentController.getPaymentHistory);

export default router;

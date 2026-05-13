import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

// Rate limiting for OTP requests
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Authentication Routes
 */

// Send OTP to mobile number
router.post('/send-otp', otpRateLimit, authController.sendOtp);

// Verify OTP and login/register
router.post('/verify-otp', authController.verifyOtp);

// Complete user profile (protected)
router.post('/complete-profile', authenticate, authController.completeProfile);

// Refresh access token
router.post('/refresh', authController.refreshToken);

// Logout user (protected)
router.post('/logout', authenticate, authController.logout);

// Logout from all devices (protected)
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;

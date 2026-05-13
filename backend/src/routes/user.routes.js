import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

/**
 * User Routes - All routes require authentication
 */

// Get current user profile
router.get('/me', authenticate, userController.getMe);

// Update user profile (name, UPI ID)
router.patch('/profile', authenticate, userController.updateProfile);

// Update Expo push token
router.patch('/push-token', authenticate, userController.updatePushToken);

// Get user statistics
router.get('/stats', authenticate, userController.getUserStats);

// Delete user account
router.delete('/account', authenticate, userController.deleteAccount);

export default router;

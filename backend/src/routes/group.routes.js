import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as groupController from '../controllers/group.controller.js';

const router = express.Router();

/**
 * Group Routes - All routes require authentication
 */

// Create a new group
router.post('/', authenticate, groupController.createGroup);

// Join an existing group using invite code
router.post('/join', authenticate, groupController.joinGroup);

// Get group details
router.get('/:groupId', authenticate, groupController.getGroup);

// Get group balance
router.get('/:groupId/balance', authenticate, groupController.getBalance);

// Send payment reminder
router.post('/:groupId/remind', authenticate, groupController.sendReminder);

export default router;

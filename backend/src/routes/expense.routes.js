import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as expenseController from '../controllers/expense.controller.js';

const router = express.Router();

/**
 * Expense Routes - All routes require authentication
 */

// Add a new expense
router.post('/', authenticate, expenseController.addExpense);

// Get expenses for a group
router.get('/group/:groupId', authenticate, expenseController.getGroupExpenses);

// Get single expense details
router.get('/:expenseId', authenticate, expenseController.getExpense);

// Update an expense (description and date only)
router.patch('/:expenseId', authenticate, expenseController.updateExpense);

// Delete an expense
router.delete('/:expenseId', authenticate, expenseController.deleteExpense);

export default router;

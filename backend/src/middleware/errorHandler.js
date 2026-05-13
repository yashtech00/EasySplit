import { sendError, sendInternalError } from '../utils/response.js';
import { env } from '../config/env.js';

/**
 * Global error handler middleware for Express app
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details
  console.error('🚨 Error occurred:', {
    message: err.message,
    stack: env.isDevelopment ? err.stack : undefined,
    url: req.url,
    method: req.method,
    userId: req.userId,
    timestamp: new Date().toISOString()
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
  }
  
  if (err.name === 'CastError') {
    return sendError(res, 'Invalid data format', 400, 'INVALID_FORMAT');
  }
  
  if (err.code === 'P2002') {
    // Prisma unique constraint violation
    return sendError(res, 'Resource already exists', 409, 'DUPLICATE_RESOURCE');
  }
  
  if (err.code === 'P2025') {
    // Prisma record not found
    return sendError(res, 'Resource not found', 404, 'NOT_FOUND');
  }
  
  if (err.code === 'P2003') {
    // Prisma foreign key constraint violation
    return sendError(res, 'Invalid reference', 400, 'INVALID_REFERENCE');
  }
  
  // Default to internal server error
  const message = env.isDevelopment ? err.message : 'Internal server error';
  return sendInternalError(res, message);
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
  return sendError(res, `Route ${req.method} ${req.url} not found`, 404, 'NOT_FOUND');
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};



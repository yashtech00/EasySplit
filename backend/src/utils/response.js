/**
 * Response utility functions for consistent API responses
 */

// Send success response
export const sendSuccess = (res, data = null, status = 200, message = 'Success') => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(status).json(response);
};

// Send error response
export const sendError = (res, message = 'Internal Server Error', status = 400, code = null) => {
  const response = {
    success: false,
    message
  };
  
  if (code) {
    response.code = code;
  }
  
  return res.status(status).json(response);
};

// Send validation error response
export const sendValidationError = (res, errors = []) => {
  return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
};

// Send not found response
export const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, 404, 'NOT_FOUND');
};

// Send unauthorized response
export const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, message, 401, 'UNAUTHORIZED');
};

// Send forbidden response
export const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, message, 403, 'FORBIDDEN');
};

// Send conflict response
export const sendConflict = (res, message = 'Resource conflict') => {
  return sendError(res, message, 409, 'CONFLICT');
};

// Send rate limit response
export const sendRateLimit = (res, message = 'Too many requests') => {
  return sendError(res, message, 429, 'RATE_LIMIT');
};

// Send internal server error response
export const sendInternalError = (res, message = 'Internal server error') => {
  return sendError(res, message, 500, 'INTERNAL_ERROR');
};



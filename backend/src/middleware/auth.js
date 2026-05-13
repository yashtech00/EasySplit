import { verifyAccessToken } from '../utils/jwt.js';
import { sendUnauthorized } from '../utils/response.js';

/**
 * Authentication middleware - verifies JWT token and attaches userId to request
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Access token required');
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = verifyAccessToken(token);
      req.userId = decoded.userId;
      next();
    } catch (jwtError) {
      return sendUnauthorized(res, 'Invalid or expired access token');
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return sendUnauthorized(res, 'Authentication failed');
  }
};



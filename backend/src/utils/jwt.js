import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * JWT utility functions for SplitEasy backend
 */

// Sign access token (15 minutes expiry)
export const signAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Sign refresh token (30 days expiry)
export const signRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Generate both tokens for a user
export const generateTokenPair = (userId) => {
  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId)
  };
};


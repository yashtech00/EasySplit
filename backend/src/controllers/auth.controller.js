import { prisma } from '../config/database.js';
import { generateTokenPair, verifyRefreshToken, signAccessToken } from '../utils/jwt.js';
import { sendSuccess, sendError, sendValidationError, sendUnauthorized, sendRateLimit } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { verifyOtp as verifyOtpService, sendOtp as sendOtpService } from '../services/otp.service.js';
import { notifyWelcome } from '../services/notification.service.js';
import { validateUpiId } from '../services/upi.service.js';

/**
 * Authentication Controller
 */

// Send OTP to mobile number
export const sendOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  // Validate mobile number
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return sendValidationError(res);
  }

  try {
    await sendOtpService(mobile);
    return sendSuccess(res, null, 200, 'OTP sent successfully');
  } catch (error) {
    if (error.message.includes('Too many OTP requests')) {
      return sendRateLimit(res, error.message);
    }
    return sendError(res, 'Failed to send OTP', 500);
  }
});

// Verify OTP and login/register user
// Verify OTP and login/register user
export const verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;

  // Validate inputs
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile) || !otp || !/^\d{6}$/.test(otp)) {
    return sendValidationError(res);
  }

  // Verify OTP
  const isValidOtp = await verifyOtpService(mobile, otp);
  if (!isValidOtp) {
    return sendUnauthorized(res, 'Invalid or expired OTP');
  }

  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { mobile }
    });

    const isNewUser = !user;

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          mobile
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user.id);

    // Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id
      }
    });

    // Prepare response data
    const responseData = {
      user: {
        id: user.id,
        mobile: user.mobile,
        name: user.name,
        upiId: user.upiId,
        expoPushToken: user.expoPushToken,
        isNewUser
      },
      accessToken,
      refreshToken
    };

    // Send welcome notification for new users
    if (isNewUser && user.expoPushToken) {
      await notifyWelcome(user);
    }

    return sendSuccess(res, responseData, 200, 'Login successful');
  } catch (error) {
    console.error('Error during OTP verification:', error);
    return sendError(res, 'Login failed', 500);
  }
});

// Complete user profile (for new users)
export const completeProfile = asyncHandler(async (req, res) => {
  const { name, upiId } = req.body;
  const userId = req.userId;

  // Validate name
  if (!name || name.trim().length < 2) {
    return sendValidationError(res);
  }

  // Validate UPI ID if provided
  if (upiId) {
    if (!validateUpiId(upiId)) {
      return sendError(res, 'Invalid UPI ID format', 400);
    }
  }

  try {
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        upiId: upiId || null
      },
      select: {
        id: true,
        mobile: true,
        name: true,
        upiId: true,
        expoPushToken: true
      }
    });

    return sendSuccess(res, updatedUser, 200, 'Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    return sendError(res, 'Failed to update profile', 500);
  }
});

// Refresh access token
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendUnauthorized(res, 'Refresh token required');
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken || storedToken.userId !== decoded.userId) {
      return sendUnauthorized(res, 'Invalid refresh token');
    }

    // Generate new access token
    const newAccessToken = signAccessToken(decoded.userId);

    return sendSuccess(res, { accessToken: newAccessToken }, 200, 'Token refreshed');
  } catch (error) {
    return sendUnauthorized(res, 'Invalid refresh token');
  }
});

// Logout user
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const userId = req.userId;

  try {
    // Remove refresh token from database
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: {
          token: refreshToken,
          userId: userId
        }
      });
    } else {
      // Remove all refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });
    }

    return sendSuccess(res, null, 200, 'Logout successful');
  } catch (error) {
    console.error('Error during logout:', error);
    return sendError(res, 'Logout failed', 500);
  }
});

// Logout from all devices
export const logoutAll = asyncHandler(async (req, res) => {
  const userId = req.userId;

  try {
    // Remove all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    return sendSuccess(res, null, 200, 'Logged out from all devices');
  } catch (error) {
    console.error('Error during logout all:', error);
    return sendError(res, 'Logout failed', 500);
  }
});


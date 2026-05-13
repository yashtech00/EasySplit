import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

/**
 * OTP Service - handles OTP generation, sending, and verification
 */

// Generate a 6-digit OTP
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via MSG91 (or mock in development)
export const sendOtp = async (mobile) => {
  try {
    // Check rate limiting first
    await checkRateLimit(mobile);
    
    const otp = env.isDevelopment && !env.MSG91_AUTH_KEY ? env.MOCK_OTP : generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    // Save OTP record to database
    await prisma.otpRecord.create({
      data: {
        mobile,
        otp,
        expiresAt,
        used: false
      }
    });
    
    // Send OTP via MSG91 if configured
    if (env.MSG91_AUTH_KEY && !env.isDevelopment) {
      await sendViaMsg91(mobile, otp);
    }
    
    console.log(`📱 OTP sent to ${mobile}: ${env.isDevelopment ? otp : '***'}`);
    
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};

// Verify OTP
export const verifyOtp = async (mobile, otp) => {
  try {
    const otpRecord = await prisma.otpRecord.findFirst({
      where: {
        mobile,
        otp,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!otpRecord) {
      return false;
    }
    
    // Mark OTP as used
    await prisma.otpRecord.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });
    
    console.log(`✅ OTP verified for ${mobile}`);
    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

// Check rate limiting (max 3 OTPs in 10 minutes)
export const checkRateLimit = async (mobile) => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const recentOtps = await prisma.otpRecord.count({
      where: {
        mobile,
        createdAt: {
          gte: tenMinutesAgo
        }
      }
    });
    
    if (recentOtps >= 3) {
      throw new Error('Too many OTP requests. Please wait before trying again.');
    }
    
    return true;
  } catch (error) {
    if (error.message.includes('Too many OTP requests')) {
      throw error;
    }
    console.error('Error checking rate limit:', error);
    throw new Error('Failed to check rate limit');
  }
};

// Send OTP via MSG91 API
export const sendViaMsg91 = async (mobile, otp) => {
  try {
    const response = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authkey': env.MSG91_AUTH_KEY
      },
      body: JSON.stringify({
        template_id: env.MSG91_TEMPLATE_ID,
        mobile: `91${mobile}`,
        otp: otp
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`MSG91 API error: ${errorData.message || 'Unknown error'}`);
    }
    
    console.log(`✅ OTP sent via MSG91 to ${mobile}`);
    return true;
  } catch (error) {
    console.error('MSG91 API error:', error);
    throw error;
  }
};

// Clean up expired OTP records (can be called periodically)
export const cleanupExpiredOtps = async () => {
  try {
    const result = await prisma.otpRecord.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    
    if (result.count > 0) {
      console.log(`🧹 Cleaned up ${result.count} expired OTP records`);
    }
    
    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return 0;
  }
};


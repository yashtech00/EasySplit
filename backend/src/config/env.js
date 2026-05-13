import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'PORT'
];

const optionalEnvVars = [
  'NODE_ENV',
  'MSG91_AUTH_KEY',
  'MSG91_TEMPLATE_ID'
];

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  
  // Server
  PORT: parseInt(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // MSG91 for OTP
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY,
  MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID,
  
  // Development helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

// Validate required environment variables
const missingVars = requiredEnvVars.filter(varName => !env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease check your .env file and try again.');
  process.exit(1);
}

// Log environment (without sensitive values)
console.log(`🚀 Environment: ${env.NODE_ENV}`);
console.log(`🔌 Port: ${env.PORT}`);
console.log(`📊 Database: ${env.DATABASE_URL ? 'Connected' : 'Not configured'}`);

if (env.isDevelopment) {
  console.log('🛠️  Development mode enabled');
  
  // In development, if MSG91 is not configured, we'll use a mock OTP
  if (!env.MSG91_AUTH_KEY) {
    console.log('📱 MSG91 not configured - using mock OTP (123456)');
    env.MOCK_OTP = '123456';
  }
}


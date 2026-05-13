import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';

dotenv.config();

// Create Neon adapter with pooled connection
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL
});

// In Prisma 7 with Neon, use the adapter
const prisma = new PrismaClient({ adapter });

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    const otpCount = await prisma.otpRecord.count();
    console.log(`✅ Found ${otpCount} OTP records in database`);
    
    console.log('\n✅ All database tests passed!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

import express from 'express';
import cors from 'cors';
import { prisma } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import groupRoutes from './routes/group.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import paymentRoutes from './routes/payment.routes.js';

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: env.isDevelopment ? true : ['https://yourapp.com'], // Configure for production
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/group', groupRoutes);
app.use('/api/v1/expense', expenseRoutes);
app.use('/api/v1/payment', paymentRoutes);

// API documentation endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'SplitEasy API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      user: '/api/v1/user',
      group: '/api/v1/group',
      expense: '/api/v1/expense',
      payment: '/api/v1/payment'
    },
    documentation: 'https://your-api-docs.com'
  });
});

// Handle 404 for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Starting graceful shutdown...');
  
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Start listening
    app.listen(env.PORT, () => {
      console.log(`🚀 SplitEasy API Server running on port ${env.PORT}`);
      console.log(`📖 API Documentation: http://localhost:${env.PORT}/api/v1`);
      console.log(`🏥 Health Check: http://localhost:${env.PORT}/health`);
      
      if (env.isDevelopment) {
        console.log('🛠️  Development mode enabled');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();


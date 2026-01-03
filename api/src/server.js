require('dotenv').config();
const app = require('./app');
const { prisma } = require('./config/database');

const PORT = process.env.PORT || 5000;

/**
 * Start HTTP server
 * Bind to 0.0.0.0 to support IPv4 + IPv6 (fixes ::1 localhost issue on Windows)
 */
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
});

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  console.log(`🛑 Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    console.log('✅ HTTP server closed');

    try {
      await prisma.$disconnect();
      console.log('✅ Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcing shutdown');
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

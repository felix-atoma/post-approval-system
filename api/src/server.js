require('dotenv').config();
const app = require('./app');
const { initializeDatabase, shutdown } = require('./config/database');

const PORT = process.env.PORT || 5000;

/**
 * Start HTTP server
 * Bind to 0.0.0.0 to support IPv4 + IPv6 (fixes ::1 localhost issue on Windows)
 */
async function startServer() {
  console.log('🚀 Starting Post Management System API...');
  console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔗 Health check: http://localhost:' + PORT + '/health');
  
  // Initialize database connection
  await initializeDatabase();
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Database: Neon PostgreSQL`);
    console.log(`🔐 JWT: Enabled`);
    console.log(`📧 Email: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
  });

  return server;
}

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  console.log(`🛑 Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed');
      await shutdown();
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcing shutdown');
      process.exit(1);
    }, 10000);
  } else {
    await shutdown();
    process.exit(0);
  }
};

// Start the server
let server;
startServer()
  .then((s) => {
    server = s;
    
    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Catch unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      console.error('❌ Unhandled Rejection:', reason);
    });

    // Catch uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
// config/database.js
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  errorFormat: 'pretty',
  
  // ADD THIS FOR NEON SUPPORT:
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Test database connection with retry logic
async function testConnection(maxRetries = 3, delay = 2000) {
  console.log('🔗 Testing Neon PostgreSQL connection...');
  console.log('Using connection:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);
      
      await prisma.$connect();
      console.log('✅ Connected to Neon PostgreSQL via Prisma');
      
      // Test with a simple query
      const result = await prisma.$queryRaw`SELECT version()`;
      console.log('📊 PostgreSQL version:', result[0]?.version || 'Unknown');
      
      // Check if tables exist
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      console.log('📋 Available tables:', tables.map(t => t.table_name).join(', ') || 'None');
      
      return true;
    } catch (error) {
      console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
      console.error('Error code:', error.code);
      
      if (error.code === 'P1001') {
        console.log('\n🔧 Neon Troubleshooting:');
        console.log('1. Database might be paused - it auto-resumes in 2-5 seconds');
        console.log('2. Using connection string:', process.env.DATABASE_URL?.split('@')[1]);
        console.log('3. Testing direct connection...');
        
        // Try direct connection as fallback
        if (attempt === maxRetries) {
          console.log('💡 Tip: If using Neon, ensure:');
          console.log('   - DATABASE_URL uses pooler endpoint (...-pooler.c-3...)');
          console.log('   - Add ?sslmode=require&pgbouncer=true&connect_timeout=15');
          console.log('   - Test manually: psql "' + process.env.DATABASE_URL + '"');
        }
      }
      
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${delay / 1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.warn('⚠️  Could not establish database connection after retries');
        return false;
      }
    }
  }
}

// Initialize database connection
async function initializeDatabase() {
  console.log('🔄 Initializing database connection...');
  
  const connected = await testConnection();
  
  if (!connected) {
    console.warn('📌 Starting server without database connection');
    console.warn('⚠️  Some features may not work until database is connected');
  }
  
  return connected;
}

// Graceful shutdown
async function shutdown() {
  console.log('🛑 Closing database connections...');
  try {
    await prisma.$disconnect();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
}

module.exports = { 
  prisma,
  testConnection,
  initializeDatabase,
  shutdown
};
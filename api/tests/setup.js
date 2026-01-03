// tests/setup.js
const { prisma } = require('../src/config/database');

// Increase timeout for database operations
jest.setTimeout(15000);

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
};

// Global beforeAll - runs once before all tests
beforeAll(async () => {
  console.log('🔧 Setting up tests in', process.env.NODE_ENV, 'environment');
  
  // Suppress console output during tests
  if (process.argv.includes('--silent') || !process.argv.includes('--verbose')) {
    console.log = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    console.warn = jest.fn();
  }
  
  try {
    // Clean database
    await prisma.refreshToken.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ Database cleaned');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
    throw error;
  }
});

// Global afterAll - runs once after all tests
afterAll(async () => {
  // Clean up
  try {
    await prisma.refreshToken.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
  
  await prisma.$disconnect();
  
  // Restore console methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
});
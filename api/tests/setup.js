// Global test setup
const { prisma } = require('../src/config/database');

// Increase timeout for database operations
jest.setTimeout(15000);

// Clean database before each test file
beforeAll(async () => {
  // Ensure database is clean
  await prisma.refreshToken.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
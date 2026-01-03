const { prisma } = require('../src/config/database');

async function cleanTestDB() {
  console.log('🧹 Cleaning test database...');
  
  await prisma.refreshToken.deleteMany();
  await prisma.post.deleteMany();
  
  // Delete ALL test users so they're recreated fresh
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'admin@example.com',
          'user@example.com',
          'profile@example.com',
          'logout@example.com',
          'refresh@example.com',
          'passwordreset@example.com',
          'user2@example.com',
        ]
      }
    }
  });
  
  console.log('✅ Test database cleaned');
  await prisma.$disconnect();
}

cleanTestDB();
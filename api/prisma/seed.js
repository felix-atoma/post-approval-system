const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.refreshToken.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: adminPassword,
      passwordReset: false
    }
  });

  // Create regular user
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'Regular User',
      role: 'USER',
      password: userPassword,
      passwordReset: false
    }
  });

  // Create user without password
  const newUser = await prisma.user.create({
    data: {
      email: 'newuser@example.com',
      name: 'New User',
      role: 'USER',
      password: null,
      passwordReset: true
    }
  });

  // Create sample posts
  const posts = [
    {
      title: 'Welcome to the Platform',
      content: 'This is a sample approved post. Welcome everyone!',
      status: 'APPROVED',
      userId: user.id
    },
    {
      title: 'Pending Review Post',
      content: 'This post is waiting for admin approval.',
      status: 'PENDING',
      userId: user.id
    },
    {
      title: 'Rejected Post Example',
      content: 'This post was rejected for demonstration purposes.',
      status: 'REJECTED',
      rejectionReason: 'Content does not meet community guidelines.',
      userId: user.id
    },
    {
      title: 'Another Pending Post',
      content: 'This is another post waiting for review.',
      status: 'PENDING',
      userId: user.id
    }
  ];

  for (const post of posts) {
    await prisma.post.create({ data: post });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n🔑 Test Credentials:');
  console.log('   Admin: admin@example.com / admin123');
  console.log('   User: user@example.com / user123');
  console.log('   New User: newuser@example.com (no password - set on first login)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// view-users.js
const { prisma } = require('./src/config/database');

async function viewUsers() {
  try {
    console.log('=== ALL USERS IN DATABASE ===\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        passwordReset: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Has Password: ${user.password ? 'YES' : 'NO'}`);
      console.log(`  Password Reset Flag: ${user.passwordReset}`);
      console.log(`  Created: ${user.createdAt.toISOString()}`);
      console.log('---');
    });
    
    // Check specific test emails
    console.log('\n=== CHECKING TEST EMAILS ===\n');
    const testEmails = [
      'admin@example.com',
      'user@example.com',
      'refresh@example.com',
      'profile@example.com',
      'test@example.com'
    ];
    
    for (const email of testEmails) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() } // Check case-insensitive
      });
      console.log(`${email}: ${user ? 'FOUND ✓' : 'NOT FOUND ✗'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewUsers();
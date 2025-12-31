// check-user-now.js
const { prisma } = require('./src/config/database');

async function checkUserNow() {
  console.log('=== CHECKING USER IN REAL TIME ===\n');
  
  const emailToCheck = 'testuser@example.com';
  
  try {
    console.log(`Looking for user: ${emailToCheck}`);
    
    // Check case-insensitive
    const user = await prisma.user.findUnique({
      where: { email: emailToCheck.toLowerCase() }
    });
    
    console.log('User found:', !!user);
    
    if (user) {
      console.log('\nUser details:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Has password:', !!user.password);
      console.log('Password reset:', user.passwordReset);
      console.log('Created:', user.createdAt.toISOString());
    } else {
      console.log('\nUser NOT found. Checking all users...');
      
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true }
      });
      
      console.log(`Total users in database: ${allUsers.length}`);
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.name})`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserNow();
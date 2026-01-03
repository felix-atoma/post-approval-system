const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdmin() {
  const result = await prisma.user.updateMany({
    where: { email: 'admin@system.local' },
    data: { role: 'ADMIN' }
  });
  
  console.log('✅ Updated admin role:', result);
  
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@system.local' }
  });
  
  console.log('Admin user:', admin);
}

fixAdmin()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
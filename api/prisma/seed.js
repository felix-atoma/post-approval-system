// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Helper: create or update user with ALL fields
  async function upsertUser(data) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });

    if (existing) {
      console.log(`⏭️ User exists: ${data.email}, updating all fields...`);
      
      // ✅ FIX: Update ALL important fields, not just password
      const updateData = {};
      if (data.password !== undefined) updateData.password = data.password;
      if (data.role !== undefined) updateData.role = data.role;  // ← FIX: Update role
      if (data.name !== undefined) updateData.name = data.name;  // ← FIX: Update name
      if (data.passwordReset !== undefined) updateData.passwordReset = data.passwordReset;  // ← FIX: Update flag
      
      return await prisma.user.update({
        where: { email: data.email },
        data: updateData,
      });
    }

    const user = await prisma.user.create({ data });
    console.log(`✅ Created user: ${data.email}`);
    return user;
  }

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin123Password = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);
  const user2Password = await bcrypt.hash('user456', 10);

  // Create/Update admin users
  const systemAdmin = await upsertUser({
    email: 'admin@system.local',
    name: 'System Admin',
    role: 'ADMIN',
    password: adminPassword,
    passwordReset: false,
  });

  const admin = await upsertUser({
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    password: admin123Password,
    passwordReset: false,
  });

  // Create/Update regular users
  const user = await upsertUser({
    email: 'user@example.com',
    name: 'Regular User',
    role: 'USER',
    password: userPassword,
    passwordReset: false,
  });

  const user2 = await upsertUser({
    email: 'user2@example.com',
    name: 'Second User',
    role: 'USER',
    password: user2Password,
    passwordReset: false,
  });

  // Users without password
  const newUser = await upsertUser({
    email: 'newuser@example.com',
    name: 'New User',
    role: 'USER',
    password: null,
    passwordReset: true,
  });

  const guest = await upsertUser({
    email: 'guest@example.com',
    name: 'Guest User',
    role: 'USER',
    password: null,
    passwordReset: true,
  });

  // ✅ Verify admin roles
  console.log('\n✅ Verifying admin users:');
  console.log(`   ${systemAdmin.email}: role=${systemAdmin.role}`);
  console.log(`   ${admin.email}: role=${admin.role}`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n🔑 Test Credentials:');
  console.log('   System Admin: admin@system.local / Admin@123');
  console.log('   Admin: admin@example.com / admin123');
  console.log('   User: user@example.com / user123');
  console.log('   User2: user2@example.com / user456');
  console.log('   New User: newuser@example.com (no password, set on first login)');
  console.log('   Guest User: guest@example.com (no password, set on first login)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const permanentUsers = [
  { email: "admin@system.local", password: "Admin123", name: "System Admin", role: "ADMIN" },
  { email: "user@system.local", password: "User123", name: "System User", role: "USER" },
  { email: "editor@system.local", password: "Editor123", name: "System Editor", role: "EDITOR" },
];

async function createPermanentUsers() {
  try {
    console.log("Creating permanent system users (won't be deleted by tests)...\n");
    
    for (const userData of permanentUsers) {
      // Delete if exists
      await prisma.user.deleteMany({
        where: { email: userData.email }
      });
      
      // Create new
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          passwordReset: false
        }
      });
      
      console.log(`✅ ${userData.role.padEnd(8)}: ${userData.email.padEnd(25)} / ${userData.password}`);
    }
    
    console.log("\n🎉 PERMANENT USERS CREATED!");
    console.log("Domain: @system.local (tests won't delete these)");
    console.log("\nUse these to login:");
    console.log("========================");
    permanentUsers.forEach(u => {
      console.log(`${u.role.padEnd(8)}: ${u.email} / ${u.password}`);
    });
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createPermanentUsers();

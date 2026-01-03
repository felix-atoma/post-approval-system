const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const testUsers = [
  { email: "admin@test.com", password: "Admin123", name: "Admin User", role: "ADMIN" },
  { email: "user@test.com", password: "User123", name: "Regular User", role: "USER" },
  { email: "editor@test.com", password: "Editor123", name: "Editor User", role: "EDITOR" },
  { email: "pending@test.com", password: "Pending123", name: "Pending User", role: "PENDING" },
];

async function createAllUsers() {
  try {
    console.log("Creating test users for all roles...\n");
    
    for (const userData of testUsers) {
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
      
      console.log(`✅ ${userData.role.padEnd(8)}: ${userData.email.padEnd(20)} / ${userData.password}`);
    }
    
    console.log("\n🎉 All test users created!");
    console.log("\nUse these to login:");
    console.log("========================");
    testUsers.forEach(u => {
      console.log(`${u.role.padEnd(8)}: ${u.email} / ${u.password}`);
    });
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAllUsers();

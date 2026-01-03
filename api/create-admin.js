const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = "admin@test.com";
    const password = "Admin123";
    
    console.log("Creating admin user...");
    
    // Delete if exists
    await prisma.user.deleteMany({
      where: { email }
    });
    
    // Create
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: "System Administrator",
        password: hashedPassword,
        role: "ADMIN",
        passwordReset: false
      }
    });
    
    console.log("✅ ADMIN USER CREATED!");
    console.log("========================");
    console.log("Email:    " + email);
    console.log("Password: " + password);
    console.log("Role:     " + user.role);
    console.log("");
    console.log("Use these credentials to login to your app!");
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        passwordReset: true,
        password: true
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    
    console.log("Available users (" + users.length + " total):");
    console.log("================================\n");
    
    let usersWithPassword = 0;
    
    users.forEach((user, i) => {
      const hasPassword = !!user.password;
      if (hasPassword) usersWithPassword++;
      
      console.log(`${i+1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has password: ${hasPassword ? "✅ Yes" : "❌ No"}`);
      console.log(`   Password reset: ${user.passwordReset ? "Required" : "Not required"}`);
      console.log("");
    });
    
    console.log(`\n📊 Summary: ${usersWithPassword} users with passwords, ${users.length - usersWithPassword} without passwords`);
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

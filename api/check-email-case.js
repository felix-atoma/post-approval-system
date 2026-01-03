const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkEmailCase() {
  try {
    console.log("Checking email case sensitivity...");
    
    // Try exact match
    const exact = await prisma.user.findFirst({
      where: { email: "admin@test.com" }
    });
    console.log("Exact match 'admin@test.com':", exact ? "✅ Found" : "❌ Not found");
    
    // Try case-insensitive
    const insensitive = await prisma.user.findMany({
      where: {
        email: {
          contains: "admin",
          mode: "insensitive"
        }
      }
    });
    console.log("\nUsers containing 'admin' (case-insensitive):");
    insensitive.forEach(user => {
      console.log(`  • ${user.email} (ID: ${user.id})`);
    });
    
    // List all users with their exact emails
    const all = await prisma.user.findMany({
      select: { email: true, id: true },
      orderBy: { createdAt: "desc" }
    });
    console.log("\nAll user emails:");
    all.forEach(user => {
      console.log(`  • "${user.email}"`);
    });
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailCase();

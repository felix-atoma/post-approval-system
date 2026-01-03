// check-all-roles.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkRoles() {
  try {
    console.log("Checking Role enum values...");
    
    // Method 1: Direct SQL query
    const sqlResult = await prisma.$queryRaw`SELECT enum_range(NULL::"Role")`;
    console.log("✅ SQL query result:", sqlResult[0].enum_range);
    
    // Method 2: Check each value
    const values = ["ADMIN", "USER", "EDITOR", "PENDING"];
    console.log("\nTesting each role:");
    
    for (const role of values) {
      try {
        const testEmail = `${role.toLowerCase()}${Date.now()}@example.com`;
        const user = await prisma.user.create({
          data: {
            email: testEmail,
            name: `Test ${role} User`,
            role: role
          }
        });
        console.log(`  ✅ ${role}: Works`);
        
        // Clean up
        await prisma.user.delete({ where: { email: testEmail } });
      } catch (error) {
        console.log(`  ❌ ${role}: Fails - ${error.message.split("\n")[0]}`);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\nDone!");
  }
}

checkRoles();

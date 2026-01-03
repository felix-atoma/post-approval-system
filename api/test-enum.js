const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testEnum() {
  try {
    console.log("Testing enum values...\n");
    
    // 1. Check what roles are available
    console.log("1. Checking available roles in database...");
    const roles = await prisma.$queryRaw`SELECT enum_range(NULL::"Role")`;
    console.log("   ✅ Available roles:", roles[0].enum_range);
    
    // 2. Try to create a user with PENDING role
    console.log("\n2. Testing PENDING role creation...");
    const testEmail = `test${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Test PENDING User",
        role: "PENDING"
      }
    });
    console.log("   ✅ Created user with PENDING role");
    console.log("      Email:", user.email);
    console.log("      Role:", user.role);
    
    // 3. Try to create a user with EDITOR role
    console.log("\n3. Testing EDITOR role creation...");
    const editorEmail = `editor${Date.now()}@example.com`;
    const editor = await prisma.user.create({
      data: {
        email: editorEmail,
        name: "Test EDITOR User",
        role: "EDITOR"
      }
    });
    console.log("   ✅ Created user with EDITOR role");
    console.log("      Email:", editor.email);
    console.log("      Role:", editor.role);
    
    // 4. Clean up test users
    console.log("\n4. Cleaning up test users...");
    const deleteResult = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: testEmail },
          { email: editorEmail }
        ]
      }
    });
    console.log(`   ✅ Deleted ${deleteResult.count} test users`);
    
    console.log("\n🎉 SUCCESS! All enum tests passed!");
    console.log("   • PENDING role works ✅");
    console.log("   • EDITOR role works ✅");
    console.log("   • Database schema is correct ✅");
    
  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error("   Error:", error.message);
    
    if (error.code === "P2004") {
      console.error("   Issue: Role enum value not recognized");
      console.error("   Fix: Make sure EDITOR and PENDING are in the Role enum");
    }
    
    console.error("\nFull error details:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\nDatabase connection closed.");
  }
}

// Run the test
testEnum();

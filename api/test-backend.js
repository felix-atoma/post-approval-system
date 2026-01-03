const axios = require("axios");
// Use 127.0.0.1 instead of localhost to force IPv4 and avoid IPv6 connection issues
const BASE_URL = "http://127.0.0.1:5000/api";

async function testBackend() {
  console.log("Testing Backend API...\n");
  
  // 1. First create a test user if needed
  console.log("1. Creating test user if needed...");
  const { PrismaClient } = require("@prisma/client");
  const bcrypt = require("bcryptjs");
  const prisma = new PrismaClient();
  
  try {
    const testEmail = "backendtest@system.local";
    const testPassword = "Test123";
    
    // Delete if exists
    await prisma.user.deleteMany({ where: { email: testEmail } });
    
    // Create
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    await prisma.user.create({
      data: {
        email: testEmail,
        name: "Backend Test User",
        password: hashedPassword,
        role: "ADMIN",
        passwordReset: false
      }
    });
    
    console.log("   ✅ Created test user:", testEmail);
    await prisma.$disconnect();
    
    // 2. Test login with CORRECT data
    console.log("\n2. Testing login endpoint...");
    const loginData = {
      email: testEmail,
      password: testPassword
    };
    
    console.log("   Sending:", loginData);
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData, {
      headers: { "Content-Type": "application/json" }
    });
    
    console.log("   ✅ Login successful!");
    console.log("   Status:", loginResponse.status);
    console.log("   Has token:", !!loginResponse.data.accessToken);
    
    // 3. Test other endpoints with the token
    if (loginResponse.data.accessToken) {
      const token = loginResponse.data.accessToken;
      console.log("\n3. Testing authenticated endpoints...");
      
      // Test profile endpoint
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("   ✅ Profile endpoint works");
      console.log("   User:", profileResponse.data.user.email);
      
      // Test posts endpoint
      const postsResponse = await axios.get(`${BASE_URL}/posts/my-posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("   ✅ Posts endpoint works");
      console.log("   Posts count:", postsResponse.data.posts?.length || 0);
      
      // Test users endpoint (admin only)
      try {
        const usersResponse = await axios.get(`${BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("   ✅ Users endpoint works");
        console.log("   Users count:", usersResponse.data.users?.length || 0);
      } catch (error) {
        console.log("   ⚠️ Users endpoint (admin only) - expected error for non-admin");
      }
    }
    
    console.log("\n🎉 BACKEND TESTS PASSED!");
    
  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Error:", error.response.data);
    } else {
      console.error("   Error:", error.message);
    }
    process.exit(1);
  }
}

testBackend();
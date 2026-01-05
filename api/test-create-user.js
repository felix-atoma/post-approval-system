const axios = require('axios');
require('dotenv').config();

const API_URL = 'https://post-approval-system-1.onrender.com/api';

async function testCreateUser() {
  try {
    console.log('🔐 Step 1: Login as admin...');
    
    // Login as admin
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@system.local',
      password: 'Admin@123'
    });
    
    console.log('✅ Login successful');
    const token = loginRes.data.accessToken;
    
    console.log('\n👤 Step 2: Creating new user...');
    
    // Create user
    const createRes = await axios.post(
      `${API_URL}/users`,
      {
        email: `testuser${Date.now()}@example.com`,
        name: 'Test User',
        role: 'USER'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ User created successfully!');
    console.log('📧 User email:', createRes.data.user.email);
    console.log('👤 User name:', createRes.data.user.name);
    console.log('🎭 User role:', createRes.data.user.role);
    console.log('\n📋 Full response:');
    console.log(JSON.stringify(createRes.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('\n📋 Error Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.error) {
        console.error('\n🔴 Error Details:');
        console.error('Message:', error.response.data.error.message);
        console.error('Code:', error.response.data.error.code);
      }
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    console.error('\n🔍 Full Error:');
    console.error(error);
  }
}

console.log('🚀 Testing User Creation API');
console.log('API URL:', API_URL);
console.log('─────────────────────────────\n');

testCreateUser();
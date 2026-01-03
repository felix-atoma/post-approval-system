// test-requirements.js
const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function testAllRequirements() {
  console.log('Testing all requirements...\n');
  
  // 1. Test login
  console.log('1. Testing Login...');
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'Admin123'
    });
    console.log('   ✅ Login works');
  } catch (error) {
    console.log('   ❌ Login failed:', error.response?.data?.message);
  }
  
  // 2. Check endpoints exist
  const endpoints = [
    { method: 'GET', path: '/auth/profile', desc: 'Get profile' },
    { method: 'GET', path: '/users', desc: 'List users (ADMIN)' },
    { method: 'POST', path: '/users', desc: 'Create user (ADMIN)' },
    { method: 'GET', path: '/posts', desc: 'List posts' },
    { method: 'POST', path: '/posts', desc: 'Create post' },
  ];
  
  console.log('\n2. Checking required endpoints...');
  for (const endpoint of endpoints) {
    try {
      await axios.options(`${BASE_URL}${endpoint.path}`);
      console.log(`   ✅ ${endpoint.method} ${endpoint.path} - ${endpoint.desc}`);
    } catch (error) {
      console.log(`   ❌ ${endpoint.method} ${endpoint.path} - ${endpoint.desc} (404)`);
    }
  }
}

testAllRequirements();
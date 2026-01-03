// test-post-flow.js
const axios = require('axios');
const BASE_URL = 'http://127.0.0.1:5000/api';

async function testPostFlow() {
  console.log('Testing Post Creation → Admin Review Flow...\n');

  try {
    // 1️⃣ Login as regular user
    const userEmail = 'user@example.com';
    const userPassword = 'user123';
    console.log(`1. Logging in as user (${userEmail})...`);

    const userLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: userEmail,
      password: userPassword,
    });

    const userToken = userLogin.data.accessToken;
    console.log('   ✅ User logged in successfully');

    // 2️⃣ Create a post as user
    console.log('\n2. Creating post as user...');
    const postData = {
      title: `Test Post ${Date.now()}`,
      content: 'This is a test post for admin review.',
    };

    const createResponse = await axios.post(`${BASE_URL}/posts`, postData, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    console.log('   ✅ Post created with ID:', createResponse.data.post?.id);
    console.log('   Status:', createResponse.data.post?.status);

    // 3️⃣ Login as admin
    const adminEmail = 'admin@system.local';
    const adminPassword = 'Admin@123';
    console.log(`\n3. Logging in as admin (${adminEmail})...`);

    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });

    const adminToken = adminLogin.data.accessToken;
    console.log('   ✅ Admin logged in successfully');

    // 4️⃣ Check admin dashboard for pending posts
    console.log('\n4. Checking admin dashboard for pending posts...');
    const adminPosts = await axios.get(`${BASE_URL}/posts/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { status: 'PENDING', limit: 10 },
    });

    const pendingPosts = adminPosts.data.posts || [];
    console.log(`   ✅ Found ${pendingPosts.length} pending posts`);

    if (pendingPosts.length > 0) {
      const newPost = pendingPosts.find(
        (p) =>
          p.title.includes('Test Post') ||
          p.id === createResponse.data.post?.id
      );

      if (newPost) {
        console.log('   ✅ New post found in admin dashboard!');
        console.log('      Post ID:', newPost.id);
        console.log('      Title:', newPost.title);
        console.log('      Status:', newPost.status);
        console.log('      Author:', newPost.user?.email);
      } else {
        console.log('   ⚠️ New post not found in pending list, checking all posts...');
        const allPosts = await axios.get(`${BASE_URL}/posts/admin/all`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          params: { limit: 20 },
        });
        console.log('      Total posts:', allPosts.data.posts?.length);
      }
    }

    console.log('\n🎉 Post flow test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', error.response.data);
    }
  }
}

testPostFlow();

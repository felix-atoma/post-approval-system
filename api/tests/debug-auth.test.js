const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/database');

describe('Debug Auth - Minimal Tests', () => {
  // Helper for unique emails
  const getUniqueEmail = () => {
    return `debug${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
  };

  beforeAll(async () => {
    // Only clear debug test users, not all users
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'debug'
        }
      }
    });
    console.log('Database cleared for debug tests');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('1. Test if app is running', async () => {
    const response = await request(app).get('/');
    console.log('App root response status:', response.statusCode);
    expect(response.statusCode).toBe(200);
  });

  test('2. Test simple user creation and login', async () => {
    const uniqueEmail = getUniqueEmail();
    
    // Create user with simple password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Test123', 10);
    
    await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'Debug User',
        password: hashedPassword,
        role: 'USER',
        passwordReset: false
      }
    });

    console.log('User created:', uniqueEmail);
    
    // Test 1: Login with correct credentials
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: uniqueEmail,
        password: 'Test123'
      });

    console.log('\n=== LOGIN TEST ===');
    console.log('Status:', loginRes.statusCode);
    
    if (loginRes.statusCode === 200) {
      console.log('Success! User:', loginRes.body.user?.email);
      console.log('Has access token:', !!loginRes.body.accessToken);
      console.log('Has refresh token:', !!loginRes.body.refreshToken);
    } else {
      console.log('Error:', loginRes.body.error);
    }

    // Test 2: Try login with wrong password
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: uniqueEmail,
        password: 'Wrong123'
      });

    console.log('\n=== WRONG PASSWORD TEST ===');
    console.log('Status:', wrongPassRes.statusCode);

    // Test 3: Try login with invalid email
    const invalidEmailRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: 'not-an-email',
        password: 'Test123'
      });

    console.log('\n=== INVALID EMAIL TEST ===');
    console.log('Status:', invalidEmailRes.statusCode);

    // Test 4: Try login with non-existent user
    const noUserRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: 'nonexistent@test.com',
        password: 'Test123'
      });

    console.log('\n=== NON-EXISTENT USER TEST ===');
    console.log('Status:', noUserRes.statusCode);

    expect(loginRes.statusCode).toBe(200);
    expect(wrongPassRes.statusCode).toBe(401);
    expect(invalidEmailRes.statusCode).toBe(400);
    expect(noUserRes.statusCode).toBe(401);
  });

  test('3. Test token generation and validation', async () => {
    const uniqueEmail = getUniqueEmail();
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Test123', 10);
    
    // Create fresh user for this test
    await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'Token Test User',
        password: hashedPassword,
        role: 'USER',
        passwordReset: false
      }
    });

    // First login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: uniqueEmail,
        password: 'Test123'
      });

    console.log('\n=== TOKEN VALIDATION TEST ===');
    console.log('Login status:', loginRes.statusCode);
    
    if (loginRes.statusCode !== 200) {
      console.log('Cannot proceed with token test - login failed');
      return;
    }

    const { accessToken, refreshToken } = loginRes.body;
    
    // Test 1: Get profile with valid token
    const profileRes = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Content-Type', 'application/json');

    console.log('Profile with valid token - Status:', profileRes.statusCode);

    // Test 2: Get profile with invalid token
    const invalidProfileRes = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalid-token-here')
      .set('Content-Type', 'application/json');

    console.log('Profile with invalid token - Status:', invalidProfileRes.statusCode);

    // Test 3: Get profile without token
    const noTokenRes = await request(app)
      .get('/api/auth/profile')
      .set('Content-Type', 'application/json');

    console.log('Profile without token - Status:', noTokenRes.statusCode);

    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 4: Try to refresh token
    const refreshRes = await request(app)
      .post('/api/auth/refresh-token')
      .set('Content-Type', 'application/json')
      .send({
        refreshToken: refreshToken
      });

    console.log('Refresh token attempt - Status:', refreshRes.statusCode);

    expect(profileRes.statusCode).toBe(200);
    expect(invalidProfileRes.statusCode).toBe(401);
    expect(noTokenRes.statusCode).toBe(401);
  });

  test('4. Test validation edge cases', async () => {
    console.log('\n=== VALIDATION EDGE CASES ===');
    
    // Test 1: Empty request body
    const emptyBodyRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({});

    console.log('Empty body - Status:', emptyBodyRes.statusCode);

    // Test 2: Missing email
    const missingEmailRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        password: 'Test123'
      });

    console.log('Missing email - Status:', missingEmailRes.statusCode);

    // Test 3: Missing password
    const missingPassRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: 'test@test.com'
      });

    console.log('Missing password - Status:', missingPassRes.statusCode);

    // Test 4: Very long email
    const longEmailRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: 'a'.repeat(300) + '@test.com',
        password: 'Test123'
      });

    console.log('Long email - Status:', longEmailRes.statusCode);
  });
});
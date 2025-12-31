const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/database');

describe('Debug Auth - Minimal Tests', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
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
    // Create user with simple password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Test123', 10); // Password that meets regex
    
    await prisma.user.create({
      data: {
        email: 'debug@test.com',
        name: 'Debug User',
        password: hashedPassword,
        role: 'USER',
        passwordReset: false
      }
    });

    console.log('User created: debug@test.com');
    
    // Test 1: Login with correct credentials
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: 'debug@test.com',
        password: 'Test123'
      });

    console.log('\n=== LOGIN TEST ===');
    console.log('Status:', loginRes.statusCode);
    console.log('Response keys:', Object.keys(loginRes.body));
    
    if (loginRes.statusCode === 200) {
      console.log('Success! User:', loginRes.body.user?.email);
      console.log('Has access token:', !!loginRes.body.accessToken);
      console.log('Has refresh token:', !!loginRes.body.refreshToken);
      
      if (loginRes.body.accessToken) {
        console.log('Access token starts with:', loginRes.body.accessToken.substring(0, 10));
      }
      if (loginRes.body.refreshToken) {
        console.log('Refresh token starts with:', loginRes.body.refreshToken.substring(0, 10));
      }
    } else {
      console.log('Error:', loginRes.body.error);
    }

    // Test 2: Try login with wrong password
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: 'debug@test.com',
        password: 'Wrong123'
      });

    console.log('\n=== WRONG PASSWORD TEST ===');
    console.log('Status:', wrongPassRes.statusCode);
    console.log('Error code:', wrongPassRes.body.error?.code);

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
    console.log('Error code:', invalidEmailRes.body.error?.code);

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
    console.log('Error code:', noUserRes.body.error?.code);

    expect(loginRes.statusCode).toBe(200);
    expect(wrongPassRes.statusCode).toBe(401);
    expect(invalidEmailRes.statusCode).toBe(400);
    expect(noUserRes.statusCode).toBe(401);
  });

  test('3. Test token generation and validation', async () => {
    // First login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: 'debug@test.com', // User from previous test
        password: 'Test123'
      });

    if (loginRes.statusCode !== 200) {
      console.log('Cannot proceed with token test - login failed');
      return;
    }

    const { accessToken, refreshToken } = loginRes.body;

    console.log('\n=== TOKEN VALIDATION TEST ===');
    
    // Test 1: Get profile with valid token
    const profileRes = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Content-Type', 'application/json');

    console.log('Profile with valid token - Status:', profileRes.statusCode);
    console.log('Profile data:', profileRes.body.user?.email);

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

    // Test 4: Try to refresh token
    const refreshRes = await request(app)
      .post('/api/auth/refresh-token')
      .set('Content-Type', 'application/json')
      .send({
        refreshToken: refreshToken
      });

    console.log('Refresh token attempt - Status:', refreshRes.statusCode);
    console.log('New tokens received:', !!refreshRes.body.accessToken, !!refreshRes.body.refreshToken);

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
    console.log('Error details:', emptyBodyRes.body.error?.details);

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
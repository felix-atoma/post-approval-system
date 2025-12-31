const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/database');

describe('Authentication API', () => {
  beforeAll(async () => {
    // Clear database before tests
    await prisma.refreshToken.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('Database cleared for tests');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First, create a user with proper password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Admin123', 10); // Use Admin123 not admin123
      
      console.log('Creating admin user...');
      await prisma.user.create({
        data: {
          email: 'admin@example.com', // This email exists in your DB
          name: 'Admin User',
          password: hashedPassword,
          role: 'ADMIN',
          passwordReset: false
        }
      });

      console.log('Sending login request...');
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'admin@example.com', // Match the email you just created
          password: 'Admin123' // Must be Admin123 (uppercase A)
        });

      console.log('Login response:', {
        status: res.statusCode,
        body: res.body
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true); // Check for success field
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('email', 'admin@example.com');
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'wrong@example.com', // Non-existent email
          password: 'wrongpassword'
        });

      console.log('Invalid credentials response:', {
        status: res.statusCode,
        body: res.body
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false); // Check for success field
      expect(res.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false); // Check for success field
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should fail with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'test@example.com',
          password: ''
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false); // Check for success field
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First login to get tokens
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Test123', 10); // Use Test123
      
      console.log('Creating refresh test user...');
      const user = await prisma.user.create({
        data: {
          email: 'refreshtest@example.com', // Use unique email
          name: 'Refresh Test User',
          password: hashedPassword,
          role: 'USER',
          passwordReset: false
        }
      });

      console.log('Logging in to get tokens...');
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'refreshtest@example.com',
          password: 'Test123'
        });

      console.log('Login response for refresh:', {
        status: loginRes.statusCode,
        hasTokens: !!loginRes.body.refreshToken
      });

      if (!loginRes.body.refreshToken) {
        console.error('No refresh token received!');
        return;
      }

      const refreshRes = await request(app)
        .post('/api/auth/refresh-token')
        .set('Content-Type', 'application/json')
        .send({
          refreshToken: loginRes.body.refreshToken
        });

      console.log('Refresh response:', {
        status: refreshRes.statusCode,
        body: refreshRes.body
      });

      expect(refreshRes.statusCode).toBe(200);
      expect(refreshRes.body).toHaveProperty('success', true); // Check for success field
      expect(refreshRes.body).toHaveProperty('accessToken');
      expect(refreshRes.body).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Content-Type', 'application/json')
        .send({
          refreshToken: 'invalid-token'
        });

      // Your system returns 403 for invalid tokens
      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('success', false); // Check for success field
      expect(res.body.error).toHaveProperty('code', 'INVALID_REFRESH_TOKEN');
    });

    it('should fail with missing refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false); // Check for success field
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      // Create user and get token
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Profile123', 10); // Use Profile123
      
      console.log('Creating profile test user...');
      const user = await prisma.user.create({
        data: {
          email: 'profiletest@example.com', // Use unique email
          name: 'Profile Test User',
          password: hashedPassword,
          role: 'USER',
          passwordReset: false
        }
      });

      console.log('Logging in to get token...');
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'profiletest@example.com',
          password: 'Profile123'
        });

      console.log('Login for profile test:', {
        status: loginRes.statusCode,
        hasToken: !!loginRes.body.accessToken
      });

      if (!loginRes.body.accessToken) {
        console.error('No access token received!');
        return;
      }

      const token = loginRes.body.accessToken;

      const profileRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');

      console.log('Profile response:', {
        status: profileRes.statusCode,
        body: profileRes.body
      });

      expect(profileRes.statusCode).toBe(200);
      expect(profileRes.body).toHaveProperty('success', true); // Check for success field
      expect(profileRes.body.user).toHaveProperty('email', 'profiletest@example.com');
      expect(profileRes.body.user).toHaveProperty('name', 'Profile Test User');
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Content-Type', 'application/json');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false); // Check for success field
      expect(res.body.error).toHaveProperty('code', 'ACCESS_TOKEN_REQUIRED');
    });
  });
});
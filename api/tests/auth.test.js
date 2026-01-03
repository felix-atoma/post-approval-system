const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { prisma } = require('../src/config/database');

describe('Authentication API', () => {
  // Test users - removed passwordReset field as it doesn't exist in schema
  const testUsers = [
    { 
      email: 'admin@example.com', 
      password: 'Admin123', 
      role: 'ADMIN', 
      name: 'Admin User'
    },
    { 
      email: 'user@example.com', 
      password: 'User123', 
      role: 'USER', 
      name: 'Test User'
    },
    { 
      email: 'profile@example.com', 
      password: 'Profile123', 
      role: 'USER', 
      name: 'Profile Test User'
    },
    { 
      email: 'logout@example.com', 
      password: 'Logout123', 
      role: 'USER', 
      name: 'Logout Test User'
    },
    { 
      email: 'refresh@example.com', 
      password: 'Test123', 
      role: 'USER', 
      name: 'Refresh Test User'
    }
  ];

  beforeAll(async () => {
    // Clear ALL data to avoid conflicts
    await prisma.$transaction([
      prisma.refreshToken.deleteMany(),
      prisma.post.deleteMany(),
      prisma.user.deleteMany()
    ]);

    // Create test users
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          role: user.role,
          password: hashedPassword
        }
      });
    }

    console.log('✅ Test users created in DB');
    console.log('Admin user:', testUsers[0].email, 'Role:', testUsers[0].role);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean refresh tokens only
    await prisma.refreshToken.deleteMany();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'admin@example.com',
          password: 'Admin123',
        });

      console.log('Admin login response status:', res.statusCode);
      console.log('Admin role in response:', res.body.user?.role);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('email', 'admin@example.com');
      expect(res.body.user).toHaveProperty('role', 'ADMIN');
    });

    it('should login with valid user credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'user@example.com',
          password: 'User123',
        });

      console.log('User login response status:', res.statusCode);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.user).toHaveProperty('email', 'user@example.com');
      expect(res.body.user).toHaveProperty('role', 'USER');
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should fail with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'user@example.com',
          password: '',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Login first to get refresh token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'refresh@example.com',
          password: 'Test123',
        });

      const refreshRes = await request(app)
        .post('/api/auth/refresh-token')
        .set('Content-Type', 'application/json')
        .send({
          refreshToken: loginRes.body.refreshToken,
        });

      expect(refreshRes.statusCode).toBe(200);
      expect(refreshRes.body).toHaveProperty('success', true);
      expect(refreshRes.body).toHaveProperty('accessToken');
      expect(refreshRes.body).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Content-Type', 'application/json')
        .send({ refreshToken: 'invalid-token' });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should fail with missing refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'profile@example.com',
          password: 'Profile123',
        });

      const token = loginRes.body.accessToken;

      const profileRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');

      expect(profileRes.statusCode).toBe(200);
      expect(profileRes.body).toHaveProperty('success', true);
      expect(profileRes.body.user).toHaveProperty('email', 'profile@example.com');
      expect(profileRes.body.user).toHaveProperty('name', 'Profile Test User');
    });

    it('should get admin profile with admin token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'admin@example.com',
          password: 'Admin123',
        });

      const token = loginRes.body.accessToken;

      const profileRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');

      console.log('Admin profile response:', profileRes.body.user?.role);
      
      expect(profileRes.statusCode).toBe(200);
      expect(profileRes.body).toHaveProperty('success', true);
      expect(profileRes.body.user).toHaveProperty('email', 'admin@example.com');
      expect(profileRes.body.user).toHaveProperty('role', 'ADMIN');
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Content-Type', 'application/json');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'ACCESS_TOKEN_REQUIRED');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'logout@example.com',
          password: 'Logout123',
        });

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Content-Type', 'application/json')
        .send({ refreshToken: loginRes.body.refreshToken });

      expect(logoutRes.statusCode).toBe(200);
      expect(logoutRes.body).toHaveProperty('success', true);
      expect(logoutRes.body.code).toBe('LOGOUT_SUCCESS');
    });

    it('should fail logout without refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });
});
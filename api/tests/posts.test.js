const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/database');
const { generateAccessToken } = require('../src/middleware/auth.middleware');

describe('Posts API', () => {
  let userToken;
  let adminToken;
  let userId;
  let adminId;

  beforeAll(async () => {
    // Clear database before tests
    await prisma.refreshToken.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const bcrypt = require('bcryptjs');
    const userPassword = await bcrypt.hash('user123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    const user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        name: 'Test User',
        password: userPassword,
        role: 'USER',
        passwordReset: false
      }
    });

    const admin = await prisma.user.create({
      data: {
        email: 'testadmin@example.com',
        name: 'Test Admin',
        password: adminPassword,
        role: 'ADMIN',
        passwordReset: false
      }
    });

    userId = user.id;
    adminId = admin.id;

    // Generate tokens
    userToken = generateAccessToken(user);
    adminToken = generateAccessToken(admin);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Post',
          content: 'This is a test post content'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.post).toHaveProperty('title', 'Test Post');
      expect(res.body.post).toHaveProperty('status', 'PENDING');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          title: 'Test Post',
          content: 'This is a test post content'
        });

      expect(res.statusCode).toBe(401);
    });

    it('should fail with empty title', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '',
          content: 'This is a test post content'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should fail with title too long', async () => {
      const longTitle = 'a'.repeat(201);
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: longTitle,
          content: 'This is a test post content'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/posts/my-posts', () => {
    it('should get user posts with pagination', async () => {
      // Create some test posts first
      await prisma.post.createMany({
        data: [
          {
            title: 'Post 1',
            content: 'Content 1',
            userId: userId,
            status: 'PENDING'
          },
          {
            title: 'Post 2',
            content: 'Content 2',
            userId: userId,
            status: 'APPROVED'
          }
        ]
      });

      const res = await request(app)
        .get('/api/posts/my-posts?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('posts');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.posts)).toBe(true);
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('should filter posts by status', async () => {
      const res = await request(app)
        .get('/api/posts/my-posts?status=PENDING')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      // All returned posts should have status PENDING
      if (res.body.posts.length > 0) {
        res.body.posts.forEach(post => {
          expect(post.status).toBe('PENDING');
        });
      }
    });

    it('should search posts', async () => {
      const res = await request(app)
        .get('/api/posts/my-posts?search=Post')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/posts/admin/all', () => {
    it('should get all posts for admin', async () => {
      const res = await request(app)
        .get('/api/posts/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('posts');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should fail for non-admin users', async () => {
      const res = await request(app)
        .get('/api/posts/admin/all')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should get a post by ID', async () => {
      // Create a test post
      const post = await prisma.post.create({
        data: {
          title: 'Single Post Test',
          content: 'Content for single post',
          userId: userId,
          status: 'PENDING'
        }
      });

      const res = await request(app)
        .get(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.post).toHaveProperty('id', post.id);
      expect(res.body.post).toHaveProperty('title', 'Single Post Test');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .get('/api/posts/nonexistent-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete a pending post', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Post to delete',
          content: 'This post will be deleted',
          userId: userId,
          status: 'PENDING'
        }
      });

      const res = await request(app)
        .delete(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Post deleted successfully');
    });

    it('should not delete non-pending posts', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Approved Post',
          content: 'This post is approved',
          userId: userId,
          status: 'APPROVED'
        }
      });

      const res = await request(app)
        .delete(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
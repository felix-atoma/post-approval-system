const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { prisma } = require('../src/config/database');

describe('Posts API', () => {
  let userToken;
  let adminToken;
  let userId;
  let adminId;

  // Use DIFFERENT credentials from auth.test.js
  const ADMIN_EMAIL = 'posts-admin@test.com';
  const ADMIN_PASSWORD = 'PostsAdmin123!';
  const USER_EMAIL = 'posts-user@test.com';
  const USER_PASSWORD = 'PostsUser123!';

  beforeAll(async () => {
    try {
      console.log('🔧 Setting up posts test...');
      
      // Clear ALL data to start fresh
      await prisma.$transaction([
        prisma.refreshToken.deleteMany(),
        prisma.post.deleteMany(),
        prisma.user.deleteMany()
      ]);
      
      // Create admin user
      const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const adminUser = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: 'Posts Admin',
          password: adminPassword,
          role: 'ADMIN'
        }
      });
      adminId = adminUser.id;

      // Create regular user
      const userPassword = await bcrypt.hash(USER_PASSWORD, 10);
      const regularUser = await prisma.user.create({
        data: {
          email: USER_EMAIL,
          name: 'Posts User',
          password: userPassword,
          role: 'USER'
        }
      });
      userId = regularUser.id;

      // Login to get tokens
      // User login
      const userLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: USER_EMAIL,
          password: USER_PASSWORD
        });
      
      if (userLoginRes.statusCode !== 200) {
        throw new Error(`User login failed: ${JSON.stringify(userLoginRes.body)}`);
      }
      userToken = userLoginRes.body.accessToken;

      // Admin login
      const adminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        });
      
      if (adminLoginRes.statusCode !== 200) {
        throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.body)}`);
      }
      adminToken = adminLoginRes.body.accessToken;

      console.log('✅ Posts test setup complete');
      
    } catch (error) {
      console.error('❌ Test setup failed:', error.message);
      throw error;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.post.deleteMany();
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Post',
          content: 'This is a test post content that meets the minimum length requirement.'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.post).toHaveProperty('title', 'Test Post');
      expect(res.body.post).toHaveProperty('status', 'PENDING');
      expect(res.body.post).toHaveProperty('userId', userId);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          title: 'Test Post',
          content: 'Valid content length'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('ACCESS_TOKEN_REQUIRED');
    });

    it('should fail with empty title', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '',
          content: 'Valid content length'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with title too long', async () => {
      const longTitle = 'a'.repeat(201);
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: longTitle,
          content: 'Valid content length'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with content too short', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Title',
          content: 'Short' // Less than minimum
        });

      // Expect validation error
      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/posts/my-posts', () => {
    beforeEach(async () => {
      // Create test posts
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
    });

    it('should get user posts with pagination', async () => {
      const res = await request(app)
        .get('/api/posts/my-posts?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.posts).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter posts by status', async () => {
      const res = await request(app)
        .get('/api/posts/my-posts?status=PENDING')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].status).toBe('PENDING');
    });

    it('should search posts', async () => {
      const res = await request(app)
        .get('/api/posts/my-posts?search=Post 1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].title).toBe('Post 1');
    });

    it('should return empty array when no posts', async () => {
      await prisma.post.deleteMany();
      
      const res = await request(app)
        .get('/api/posts/my-posts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.posts).toHaveLength(0);
    });

    it('should only return current user posts', async () => {
      // Create another user and post
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other User',
          password: await bcrypt.hash('password', 10),
          role: 'USER'
        }
      });

      await prisma.post.create({
        data: {
          title: 'Other User Post',
          content: 'Other content',
          userId: otherUser.id,
          status: 'PENDING'
        }
      });

      const res = await request(app)
        .get('/api/posts/my-posts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.posts).toHaveLength(2); // Should only see user's own posts
      res.body.posts.forEach(post => {
        expect(post.userId).toBe(userId);
      });
    });
  });

  describe('GET /api/posts/admin/all', () => {
    beforeEach(async () => {
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
    });

    it('should get all posts for admin', async () => {
      const res = await request(app)
        .get('/api/posts/admin/all?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.posts).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter admin posts by status', async () => {
      const res = await request(app)
        .get('/api/posts/admin/all?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].status).toBe('PENDING');
    });

    it('should fail for non-admin users', async () => {
      const res = await request(app)
        .get('/api/posts/admin/all')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/posts/admin/all');

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('ACCESS_TOKEN_REQUIRED');
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should get a post by ID', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Test Post',
          content: 'Test content',
          userId: userId,
          status: 'PENDING'
        }
      });

      const res = await request(app)
        .get(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.post.id).toBe(post.id);
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .get('/api/posts/nonexistent')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('POST_NOT_FOUND');
    });

    it('should allow admin to view any post', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'User Post',
          content: 'Content',
          userId: userId,
          status: 'PENDING'
        }
      });

      const res = await request(app)
        .get(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.post.id).toBe(post.id);
    });

    it('should not allow user to view other users pending posts', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other2@test.com',
          name: 'Other User 2',
          password: await bcrypt.hash('password', 10),
          role: 'USER'
        }
      });

      const post = await prisma.post.create({
        data: {
          title: 'Other User Pending Post',
          content: 'Content',
          userId: otherUser.id,
          status: 'PENDING'
        }
      });

      const res = await request(app)
        .get(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      // User shouldn't see other user's pending posts
      expect(res.statusCode).toBe(404);
    });

    it('should allow user to view other users approved posts', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other3@test.com',
          name: 'Other User 3',
          password: await bcrypt.hash('password', 10),
          role: 'USER'
        }
      });

      const post = await prisma.post.create({
        data: {
          title: 'Other User Approved Post',
          content: 'Content',
          userId: otherUser.id,
          status: 'APPROVED'
        }
      });

      const res = await request(app)
        .get(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      // User can see other user's approved posts
      expect(res.statusCode).toBe(200);
      expect(res.body.post.status).toBe('APPROVED');
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update a pending post', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Original Title',
          content: 'Original content',
          userId: userId,
          status: 'PENDING'
        }
      });

      const res = await request(app)
        .put(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.post.title).toBe('Updated Title');
      expect(res.body.post.content).toBe('Updated content');
    });

    it('should not update non-pending posts', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Approved Post',
          content: 'Content',
          userId: userId,
          status: 'APPROVED'
        }
      });

      const res = await request(app)
        .put(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated',
          content: 'Updated'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('POST_NOT_MODIFIABLE');
    });

    it('should not allow user to update other users posts', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other4@test.com',
          name: 'Other User 4',
          password: await bcrypt.hash('password', 10),
          role: 'USER'
        }
      });

      const post = await prisma.post.create({
        data: {
          title: 'Other User Post',
          content: 'Content',
          userId: otherUser.id,
          status: 'PENDING'
        }
      });

      const res = await request(app)
        .put(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated',
          content: 'Updated'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete a pending post', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Post to delete',
          content: 'Content',
          userId: userId,
          status: 'PENDING'
        }
      });

      const res = await request(app)
        .delete(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      
      // Verify deleted
      const deleted = await prisma.post.findUnique({
        where: { id: post.id }
      });
      expect(deleted).toBeNull();
    });

    it('should not delete non-pending posts as user', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Approved Post',
          content: 'Content',
          userId: userId,
          status: 'APPROVED'
        }
      });

      const res = await request(app)
        .delete(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('POST_NOT_MODIFIABLE');
    });

    it('should allow admin to delete any post', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Admin Deletable Post',
          content: 'Content',
          userId: userId,
          status: 'APPROVED'
        }
      });

      const res = await request(app)
        .delete(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      
      // Verify deleted
      const deleted = await prisma.post.findUnique({
        where: { id: post.id }
      });
      expect(deleted).toBeNull();
    });

    it('should not allow user to delete other users posts', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other5@test.com',
          name: 'Other User 5',
          password: await bcrypt.hash('password', 10),
          role: 'USER'
        }
      });

      const post = await prisma.post.create({
        data: {
          title: 'Other User Post',
          content: 'Content',
          userId: otherUser.id,
          status: 'PENDING'
        }
      });

      const res = await request(app)
        .delete(`/api/posts/${post.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

 describe('Admin Review Workflow', () => {
  it('should complete full admin review workflow', async () => {
    // Create post
    const createRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Review Post',
        content: 'Content for review with sufficient length for validation'
      });

    expect(createRes.statusCode).toBe(201);
    const postId = createRes.body.post.id;

    // Admin view posts
    const adminViewRes = await request(app)
      .get('/api/posts/admin/all?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminViewRes.statusCode).toBe(200);

    // Admin approve - CORRECTED PATH
    const approveRes = await request(app)
      .patch(`/api/posts/${postId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED'
      });

    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.post.status).toBe('APPROVED');

    // User view approved post
    const userViewRes = await request(app)
      .get(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(userViewRes.statusCode).toBe(200);
    expect(userViewRes.body.post.status).toBe('APPROVED');

    // Test rejection
    const post2Res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Post to Reject',
        content: 'Content to reject with sufficient length for validation'
      });

    const post2Id = post2Res.body.post.id;
    
    const rejectRes = await request(app)
      .patch(`/api/posts/${post2Id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'REJECTED',
        rejectionReason: 'Test rejection reason with sufficient length for validation'
      });

    expect(rejectRes.statusCode).toBe(200);
    expect(rejectRes.body.post.status).toBe('REJECTED');
    expect(rejectRes.body.post.rejectionReason).toBeTruthy();
  });

  it('should require rejection reason when rejecting post', async () => {
    const createRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Rejection Test',
        content: 'Content with sufficient length for validation'
      });

    expect(createRes.statusCode).toBe(201);
    const postId = createRes.body.post.id;

    const rejectRes = await request(app)
      .patch(`/api/posts/${postId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'REJECTED'
      });

    // Should fail validation because rejection reason is missing
    expect(rejectRes.statusCode).toBe(400);
    expect(rejectRes.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should not allow reviewing already reviewed posts', async () => {
    const createRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Already Reviewed',
        content: 'Content with sufficient length for validation'
      });

    expect(createRes.statusCode).toBe(201);
    const postId = createRes.body.post.id;

    // First review
    await request(app)
      .patch(`/api/posts/${postId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED'
      });

    // Second review attempt
    const secondRes = await request(app)
      .patch(`/api/posts/${postId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'REJECTED',
        rejectionReason: 'Try again with sufficient length for validation'
      });

    expect(secondRes.statusCode).toBe(400);
    expect(secondRes.body.error.code).toBe('POST_ALREADY_REVIEWED');
  });
});
});
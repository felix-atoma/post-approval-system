const express = require('express');
const router = express.Router();

const postController = require('../controllers/post.controller');
const { 
  authenticate, 
  authorize, 
  autoRefreshToken 
} = require('../middleware/auth.middleware');
const { validate, validationRules } = require('../middleware/validation.middleware');

// Create post
router.post('/',
  authenticate,
  autoRefreshToken,
  validate([
    validationRules.postTitle,
    validationRules.postContent
  ]),
  postController.createPost
);

// Get my posts
router.get('/my-posts',
  authenticate,
  autoRefreshToken,
  validate([
    ...validationRules.pagination,
    validationRules.statusFilter,
    validationRules.search
  ]),
  postController.getMyPosts
);

// Get post by ID
router.get('/:id',
  authenticate,
  autoRefreshToken,
  postController.getPostById
);

// Update post - REMOVED VALIDATION MIDDLEWARE
router.put('/:id',
  authenticate,
  autoRefreshToken,
  postController.updatePost  // <-- VALIDATION REMOVED
);

// Delete post
router.delete('/:id',
  authenticate,
  autoRefreshToken,
  postController.deletePost
);

// Get all posts (admin)
router.get('/admin/all',
  authenticate,
  autoRefreshToken,
  authorize('ADMIN'),
  validate([
    ...validationRules.pagination,
    validationRules.statusFilter,
    validationRules.search
  ]),
  postController.getAllPosts
);

// Review post (admin)
router.patch('/:id/review',
  authenticate,
  autoRefreshToken,
  authorize('ADMIN'),
  validate([
    validationRules.postStatus,
    validationRules.rejectionReason
  ]),
  postController.reviewPost
);

module.exports = router;
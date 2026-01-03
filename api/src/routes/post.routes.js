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

// Update post
router.put('/:id',
  authenticate,
  autoRefreshToken,
  validate([
    validationRules.postTitleOptional,
    validationRules.postContentOptional
  ]),
  postController.updatePost
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
  authorize(['ADMIN', 'EDITOR']),
  validate([
    ...validationRules.pagination,
    validationRules.statusFilter,
    validationRules.search
  ]),
  postController.getAllPosts
);

// Review post (admin/editor) - Fixed path: /:id/review
router.patch('/:id/review',
  authenticate,
  autoRefreshToken,
  authorize(['ADMIN', 'EDITOR']),
  validate([
    validationRules.postStatus,
    validationRules.rejectionReason
  ]),
  postController.reviewPost
);

module.exports = router;
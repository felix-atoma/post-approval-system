const express = require('express');
const router = express.Router();

const postController = require('../controllers/post.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, validationRules } = require('../middleware/validation.middleware');

/**
 * USER ROUTES
 */
router.post('/',
  authenticate,
  validate([
    validationRules.postTitle,
    validationRules.postContent
  ]),
  postController.createPost
);

router.get('/my-posts',
  authenticate,
  validate([
    ...validationRules.pagination,
    validationRules.statusFilter,
    validationRules.search
  ]),
  postController.getMyPosts
);

router.get('/:id',
  authenticate,
  postController.getPostById
);

router.put('/:id',
  authenticate,
  validate([
    validationRules.postTitle.optional(),
    validationRules.postContent.optional()
  ]),
  postController.updatePost
);

router.delete('/:id',
  authenticate,
  postController.deletePost
);

/**
 * ADMIN ROUTES
 */
router.get('/admin/all',
  authenticate,
  authorize('ADMIN'),
  validate([
    ...validationRules.pagination,
    validationRules.statusFilter,
    validationRules.search
  ]),
  postController.getAllPosts
);

router.patch('/admin/:id/review',
  authenticate,
  authorize('ADMIN'),
  validate([
    validationRules.postStatus,
    validationRules.rejectionReason
  ]),
  postController.reviewPost
);

module.exports = router;

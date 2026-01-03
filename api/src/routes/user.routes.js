const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { 
  authenticate, 
  authorize, 
  autoRefreshToken 
} = require('../middleware/auth.middleware');
const { validate, validationRules } = require('../middleware/validation.middleware');

/**
 * ADMIN ROUTES - All require admin role + auto-refresh
 */

// Create user (admin only)
router.post('/',
  authenticate,
  autoRefreshToken,
  authorize('ADMIN'),
  validate([
    validationRules.email,
    validationRules.name,
    validationRules.role
  ]),
  userController.createUser
);

// Get all users (admin only)
router.get('/',
  authenticate,
  autoRefreshToken,
  authorize('ADMIN'),
  validate([
    ...validationRules.pagination,  // ✅ Spread the array
    validationRules.roleQuery,      // ✅ Use roleQuery for GET
    validationRules.search
  ]),
  userController.getUsers
);

// Delete user (admin only)
router.delete('/:id',
  authenticate,
  autoRefreshToken,
  authorize('ADMIN'),
  userController.deleteUser
);

// Update user role (admin only)
router.patch('/:id/role',
  authenticate,
  autoRefreshToken,
  authorize('ADMIN'),
  validate([
    validationRules.role  // Role in body for PATCH
  ]),
  userController.updateUserRole
);

/**
 * USER ROUTES - Accessible by all authenticated users
 */

// Get user stats
router.get('/stats',
  authenticate,
  autoRefreshToken,
  userController.getUserStats
);

module.exports = router;
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, validationRules, authSchemas } = require('../middleware/validation.middleware');

// ----------------------
// Public routes
// ----------------------

// LOGIN - use loose password validation
router.post('/login',
  validate(authSchemas.login),
  authController.login
);

// CREATE PASSWORD - enforce strong password rules
router.post('/create-password',
  validate(authSchemas.createPassword),
  authController.createPassword
);

// REFRESH TOKEN
router.post('/refresh-token',
  validate(authSchemas.refreshToken),
  authController.refreshToken
);

// LOGOUT
router.post('/logout',
  validate([validationRules.refreshToken]),
  authController.logout
);

// ----------------------
// Protected routes
// ----------------------

// GET PROFILE
router.get('/profile', authenticate, authController.getProfile);

// UPDATE PROFILE
router.put('/profile', 
  authenticate,
  validate([
    validationRules.name.optional(),
    validationRules.password.optional()
  ]),
  authController.updateProfile
);

// VALIDATE TOKEN
router.get('/validate', authenticate, authController.validateToken);

// LOGOUT ALL DEVICES
router.post('/logout-all', 
  authenticate,
  authController.logoutAll
);

// ----------------------
// Debug routes (remove in production)
// ----------------------

// DEBUG: Check all refresh tokens (Admin only)
router.get('/debug/refresh-tokens',
  authenticate,
  authorize('ADMIN'),
  authController.debugRefreshTokens
);

module.exports = router;
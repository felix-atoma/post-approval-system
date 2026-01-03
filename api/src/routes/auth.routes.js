const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { 
  authenticate, 
  authorize, 
  autoRefreshToken,
  authRateLimiter,
  refreshTokenRateLimiter 
} = require('../middleware/auth.middleware');
const { validate, validationRules, authSchemas } = require('../middleware/validation.middleware');

// ----------------------
// Rate limiting for auth endpoints
// ----------------------

// Apply general rate limiting to all auth endpoints
router.use(authRateLimiter);

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

// REFRESH TOKEN - with special rate limiting
router.post('/refresh-token',
  refreshTokenRateLimiter, // Special rate limiter for refresh endpoint
  validate(authSchemas.refreshToken),
  authController.refreshToken
);

// LOGOUT
router.post('/logout',
  validate([validationRules.refreshToken]),
  authController.logout
);

// ----------------------
// Protected routes (Auto-refresh token on every request)
// ----------------------

// GET PROFILE
router.get('/profile', 
  authenticate, 
  autoRefreshToken,
  authController.getProfile
);

// UPDATE PROFILE
router.put('/profile', 
  authenticate,
  autoRefreshToken,
  validate([
    validationRules.name.optional(),
    validationRules.password.optional()
  ]),
  authController.updateProfile
);

// VALIDATE TOKEN
router.get('/validate', 
  authenticate, 
  autoRefreshToken,
  authController.validateToken
);

// LOGOUT ALL DEVICES
router.post('/logout-all', 
  authenticate,
  autoRefreshToken,
  authController.logoutAll
);

// ----------------------
// Debug routes (remove in production)
// ----------------------

// DEBUG: Check all refresh tokens (Admin only)
router.get('/debug/refresh-tokens',
  authenticate,
  autoRefreshToken,
  authorize('ADMIN'),
  authController.debugRefreshTokens
);

// DEBUG: Get cooldown status (Admin only)
router.get('/debug/cooldown-status',
  authenticate,
  autoRefreshToken,
  authorize('ADMIN'),
  authController.debugCooldownStatus
);

// DEBUG: Clear cooldown for a user (Admin only)
router.post('/debug/clear-cooldown',
  authenticate,
  autoRefreshToken,
  authorize('ADMIN'),
  validate([
    validationRules.userId
  ]),
  authController.debugClearCooldown
);

// DEBUG: Clear all cooldowns (Admin only) - for testing
router.post('/debug/clear-all-cooldowns',
  authenticate,
  autoRefreshToken,
  authorize('ADMIN'),
  (req, res) => {
    const { clearCooldown } = require('../middleware/auth.middleware');
    // This is a hack - in real implementation, you'd need to expose all user IDs
    res.status(200).json({
      success: true,
      message: 'Cannot clear all cooldowns without user IDs'
    });
  }
);

module.exports = router;
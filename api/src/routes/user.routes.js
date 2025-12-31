const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, validationRules } = require('../middleware/validation.middleware');

// Admin only routes
router.post('/',
  authenticate,
  authorize('ADMIN'),
  validate([
    validationRules.email,
    validationRules.name,
    validationRules.role
  ]),
  userController.createUser
);

router.get('/',
  authenticate,
  authorize('ADMIN'),
  validate(validationRules.pagination.concat([
    validationRules.role.optional(),
    validationRules.search.optional()
  ])),
  userController.getUsers
);

router.delete('/:id',
  authenticate,
  authorize('ADMIN'),
  userController.deleteUser
);

// User stats (accessible by all authenticated users)
router.get('/stats',
  authenticate,
  userController.getUserStats
);

module.exports = router;
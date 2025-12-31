const { body, query, validationResult } = require('express-validator');
const { HTTP_STATUS, ERROR_CODES, VALIDATION } = require('../utils/constants');

/**
 * Validation middleware wrapper
 */
const validate = (validations) => {
  return async (req, res, next) => {
    console.log('=== VALIDATION MIDDLEWARE DEBUG ===');
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Query params:', req.query);
    console.log('Content-Type:', req.get('Content-Type'));

    await Promise.all(validations.map(v => v.run(req)));

    const errors = validationResult(req);

    console.log('Validation errors found:', errors.array().length);
    if (!errors.isEmpty()) {
      console.log('Error details:', errors.array());
    }

    if (errors.isEmpty()) {
      console.log('Validation passed ✓');
      return next();
    }

    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: ERROR_CODES.VALIDATION_ERROR,
        details: formattedErrors
      }
    });
  };
};

/**
 * Common validation rules
 */
const validationRules = {
  // Email
  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: VALIDATION.EMAIL_MAX })
    .withMessage(`Email cannot exceed ${VALIDATION.EMAIL_MAX} characters`),

  // Name
  name: body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: VALIDATION.NAME_MAX })
    .withMessage(`Name cannot exceed ${VALIDATION.NAME_MAX} characters`),

  // Password (strict)
  password: body('password')
    .isLength({ min: VALIDATION.PASSWORD_MIN })
    .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN} characters long`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),

  // Password (login)
  loginPassword: body('password')
    .notEmpty()
    .withMessage('Password is required'),

  // Post title
  postTitle: body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: VALIDATION.TITLE_MAX })
    .withMessage(`Title cannot exceed ${VALIDATION.TITLE_MAX} characters`),

  // Post content
  postContent: body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: VALIDATION.CONTENT_MAX })
    .withMessage(`Content cannot exceed ${VALIDATION.CONTENT_MAX} characters`),

  // Pagination
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt()
  ],

  // Post status (admin review)
  postStatus: body('status')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('Status must be either APPROVED or REJECTED'),

  // Rejection reason
  rejectionReason: body('rejectionReason')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: VALIDATION.REJECTION_REASON_MAX })
    .withMessage(`Rejection reason cannot exceed ${VALIDATION.REJECTION_REASON_MAX} characters`),

  // Role
  role: body('role')
    .optional()
    .isIn(['ADMIN', 'USER'])
    .withMessage('Role must be either ADMIN or USER'),

  // Search
  search: query('search')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),

  // ✅ FIXED STATUS FILTER (IMPORTANT)
  statusFilter: query('status')
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase()
    .isIn(['PENDING', 'APPROVED', 'REJECTED'])
    .withMessage('Status must be one of: PENDING, APPROVED, REJECTED'),

  // Refresh token
  refreshToken: body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string')
};

/**
 * Auth schemas
 */
const authSchemas = {
  login: [
    validationRules.email,
    validationRules.loginPassword
  ],

  createPassword: [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required'),
    validationRules.password
  ],

  refreshToken: [
    validationRules.refreshToken
  ]
};

module.exports = {
  validate,
  validationRules,
  authSchemas
};

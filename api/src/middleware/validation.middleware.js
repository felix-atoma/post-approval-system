const { body, query, validationResult } = require('express-validator');
const { HTTP_STATUS, ERROR_CODES, VALIDATION } = require('../utils/constants');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(v => v.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
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

const validationRules = {
  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: VALIDATION.EMAIL_MAX })
    .withMessage(`Email cannot exceed ${VALIDATION.EMAIL_MAX} characters`),

  name: body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: VALIDATION.NAME_MAX })
    .withMessage(`Name cannot exceed ${VALIDATION.NAME_MAX} characters`),

  password: body('password')
    .isLength({ min: VALIDATION.PASSWORD_MIN })
    .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN} characters long`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),

  loginPassword: body('password')
    .notEmpty()
    .withMessage('Password is required'),

  postTitle: body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: VALIDATION.TITLE_MIN })
    .withMessage(`Title must be at least ${VALIDATION.TITLE_MIN} character`)
    .isLength({ max: VALIDATION.TITLE_MAX })
    .withMessage(`Title cannot exceed ${VALIDATION.TITLE_MAX} characters`),

  postTitleOptional: body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: VALIDATION.TITLE_MIN })
    .withMessage(`Title must be at least ${VALIDATION.TITLE_MIN} character`)
    .isLength({ max: VALIDATION.TITLE_MAX })
    .withMessage(`Title cannot exceed ${VALIDATION.TITLE_MAX} characters`),

  postContent: body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: VALIDATION.CONTENT_MIN })
    .withMessage(`Content must be at least ${VALIDATION.CONTENT_MIN} characters long`)
    .isLength({ max: VALIDATION.CONTENT_MAX })
    .withMessage(`Content cannot exceed ${VALIDATION.CONTENT_MAX} characters`),

  postContentOptional: body('content')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: VALIDATION.CONTENT_MIN })
    .withMessage(`Content must be at least ${VALIDATION.CONTENT_MIN} characters long`)
    .isLength({ max: VALIDATION.CONTENT_MAX })
    .withMessage(`Content cannot exceed ${VALIDATION.CONTENT_MAX} characters`),

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

  postStatus: body('status')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('Status must be either APPROVED or REJECTED'),

  rejectionReason: body('rejectionReason')
    .custom((value, { req }) => {
      if (req.body.status === 'REJECTED' && (!value || value.trim().length === 0)) {
        throw new Error('Rejection reason is required when rejecting a post');
      }
      return true;
    })
    .if(body('rejectionReason').notEmpty())
    .trim()
    .isLength({ min: VALIDATION.REJECTION_REASON_MIN })
    .withMessage(`Rejection reason must be at least ${VALIDATION.REJECTION_REASON_MIN} characters long`)
    .isLength({ max: VALIDATION.REJECTION_REASON_MAX })
    .withMessage(`Rejection reason cannot exceed ${VALIDATION.REJECTION_REASON_MAX} characters`),

  role: body('role')
    .optional()
    .isIn(['ADMIN', 'USER', 'EDITOR', 'PENDING'])
    .withMessage('Role must be one of: ADMIN, USER, EDITOR, PENDING'),

  roleQuery: query('role')
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase()
    .isIn(['ADMIN', 'USER', 'EDITOR', 'PENDING'])
    .withMessage('Role must be one of: ADMIN, USER, EDITOR, PENDING'),

  search: query('search')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),

  statusFilter: query('status')
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase()
    .isIn(['PENDING', 'APPROVED', 'REJECTED'])
    .withMessage('Status must be one of: PENDING, APPROVED, REJECTED'),

  refreshToken: body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),

  userId: body('userId')
    .notEmpty()
    .withMessage('User ID is required')
};

const authSchemas = {
  login: [
    validationRules.email,
    validationRules.loginPassword
  ],

  createPassword: [
    validationRules.userId,
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
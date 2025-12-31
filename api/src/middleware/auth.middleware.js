const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');

const JWT_SECRET = process.env.JWT_SECRET || 'your-access-token-secret';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret';

/**
 * Generate access token (5 minutes)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '5m' }
  );
};

/**
 * Generate refresh token (7 days)
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Generate both tokens
 */
const generateTokens = (user) => ({
  accessToken: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
  expiresIn: 300
});

/**
 * Verify refresh token ✅ FIXED
 */
const verifyRefreshToken = async (token) => {
  try {
    console.log('Verifying refresh token...');

    if (!token || typeof token !== 'string') {
      const err = new Error('Invalid refresh token');
      err.code = ERROR_CODES.INVALID_REFRESH_TOKEN;
      throw err;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        await prisma.refreshToken.deleteMany({ where: { token } });

        const err = new Error('Invalid refresh token');
        err.code = ERROR_CODES.INVALID_REFRESH_TOKEN;
        throw err;
      }

      const err = new Error('Invalid refresh token');
      err.code = ERROR_CODES.INVALID_REFRESH_TOKEN;
      throw err;
    }

    if (decoded.type !== 'refresh') {
      const err = new Error('Invalid refresh token');
      err.code = ERROR_CODES.INVALID_REFRESH_TOKEN;
      throw err;
    }

    // 🔥 FIX: removed revoked (does NOT exist in Prisma schema)
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token,
        userId: decoded.userId,
        expiresAt: {
          gt: new Date()
        }
      },
      include: { user: true }
    });

    if (!storedToken) {
      await prisma.refreshToken.deleteMany({ where: { token } });

      const err = new Error('Invalid refresh token');
      err.code = ERROR_CODES.INVALID_REFRESH_TOKEN;
      throw err;
    }

    return {
      user: storedToken.user,
      refreshToken: storedToken
    };
  } catch (error) {
    console.error('Refresh token verification failed:', error.message);
    throw error;
  }
};

/**
 * JWT authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'Access token required',
          code: ERROR_CODES.ACCESS_TOKEN_REQUIRED
        }
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            message: 'Token expired',
            code: ERROR_CODES.TOKEN_EXPIRED
          }
        });
      }

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'Invalid token',
          code: ERROR_CODES.INVALID_TOKEN
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        passwordReset: true
      }
    });

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'User not found',
          code: ERROR_CODES.USER_NOT_FOUND
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Internal authentication error',
        code: ERROR_CODES.INTERNAL_ERROR
      }
    });
  }
};

/**
 * Role-based authorization
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: ERROR_CODES.ACCESS_TOKEN_REQUIRED
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: ERROR_CODES.INSUFFICIENT_PERMISSIONS
        }
      });
    }

    next();
  };
};

/**
 * Auto-refresh access token
 */
const autoRefreshToken = async (req, res, next) => {
  try {
    if (req.user) {
      const newToken = generateAccessToken(req.user);
      res.setHeader('X-New-Access-Token', newToken);
      res.setHeader('Access-Control-Expose-Headers', 'X-New-Access-Token');
      res.locals.newAccessToken = newToken;
    }
    next();
  } catch (error) {
    console.error('Auto-refresh token error:', error);
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  autoRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyRefreshToken
};

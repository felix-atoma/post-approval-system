const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');

// Use same secret unless JWT_REFRESH_SECRET is explicitly set
const JWT_SECRET = process.env.JWT_SECRET || 'your-access-token-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

console.log('Auth middleware loaded. Using JWT_SECRET:', !!JWT_SECRET);
console.log('Using JWT_REFRESH_SECRET:', !!JWT_REFRESH_SECRET);

// Cooldown map to prevent rapid refresh attempts
const refreshCooldown = new Map(); // userId -> lastRefreshTime

/**
 * Generate access token (5 minutes)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '5m' }
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
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

/**
 * Generate both tokens
 */
const generateTokens = (user) => ({
  accessToken: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
  expiresIn: 300 // 5 minutes in seconds
});

/**
 * Verify refresh token - UPDATED with development-friendly cooldown
 */
const verifyRefreshToken = async (token) => {
  try {
    console.log('Verifying refresh token...');

    if (!token || typeof token !== 'string' || token.trim() === '') {
      const err = new Error('Invalid refresh token format');
      err.code = ERROR_CODES.INVALID_REFRESH_TOKEN;
      throw err;
    }

    // DISABLE COOLDOWN IN DEVELOPMENT
    const isDevelopment = process.env.NODE_ENV === 'development';
    const disableCooldown = process.env.DISABLE_REFRESH_COOLDOWN === 'true';
    
    if (!isDevelopment && !disableCooldown) {
      // Only apply cooldown in production when not disabled
      let decodedToken;
      try {
        decodedToken = jwt.decode(token);
      } catch (decodeError) {
        const err = new Error('Invalid token format');
        err.code = ERROR_CODES.INVALID_TOKEN_FORMAT;
        throw err;
      }

      if (decodedToken?.userId) {
        const lastRefresh = refreshCooldown.get(decodedToken.userId);
        const now = Date.now();
        
        if (lastRefresh && (now - lastRefresh < 1000)) {
          const waitTime = 1000 - (now - lastRefresh);
          const err = new Error(`Refresh token attempted too quickly. Please wait ${waitTime}ms.`);
          err.code = ERROR_CODES.RATE_LIMIT;
          throw err;
        }
        
        refreshCooldown.set(decodedToken.userId, now);
        
        // Clean up old entries
        if (refreshCooldown.size > 1000) {
          const fiveMinutesAgo = now - 300000;
          for (const [userId, time] of refreshCooldown.entries()) {
            if (time < fiveMinutesAgo) {
              refreshCooldown.delete(userId);
            }
          }
        }
      }
    } else {
      console.log('⚠️ Refresh token cooldown DISABLED for development');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.name);
      
      if (jwtError.name === 'TokenExpiredError') {
        // Clean up expired token from database
        await prisma.refreshToken.deleteMany({ where: { token } });
        const err = new Error('Refresh token expired');
        err.code = ERROR_CODES.REFRESH_TOKEN_EXPIRED;
        throw err;
      }

      const err = new Error('Invalid refresh token');
      err.code = ERROR_CODES.INVALID_REFRESH_TOKEN;
      throw err;
    }

    if (!decoded.type || decoded.type !== 'refresh') {
      const err = new Error('Invalid token type');
      err.code = ERROR_CODES.INVALID_TOKEN_TYPE;
      throw err;
    }

    // Find token in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: token,
        userId: decoded.userId
      },
      include: { 
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordReset: true
          }
        }
      }
    });

    if (!storedToken) {
      const err = new Error('Refresh token not found in database');
      err.code = ERROR_CODES.TOKEN_NOT_FOUND;
      throw err;
    }

    // Check database expiration
    if (new Date(storedToken.expiresAt) < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      const err = new Error('Refresh token expired');
      err.code = ERROR_CODES.REFRESH_TOKEN_EXPIRED;
      throw err;
    }

    return {
      user: storedToken.user,
      refreshToken: storedToken
    };
  } catch (error) {
    console.error('Refresh token verification failed:', error.message);
    
    // Clean up cooldown on error (only if cooldown was enabled)
    if (process.env.NODE_ENV !== 'development' && process.env.DISABLE_REFRESH_COOLDOWN !== 'true') {
      try {
        const decodedToken = jwt.decode(token);
        if (decodedToken?.userId && error.code !== ERROR_CODES.RATE_LIMIT) {
          refreshCooldown.delete(decodedToken.userId);
        }
      } catch (e) {
        // Ignore decode errors during cleanup
      }
    }
    
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

    // ✅ ADD DEBUG LOGGING
    console.log('🔐 AUTH DEBUG:', {
      path: req.path,
      email: user?.email,
      roleInDB: user?.role,
      roleInJWT: decoded.role,
      userId: decoded.userId,
      userExists: !!user
    });

    if (!user) {
      console.log('❌ User not found in database:', decoded.userId);
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
 * Role-based authorization - FIXED VERSION
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      // ✅ FIXED: Normalize roles safely
      const allowedRoles = roles
        .filter(r => r && typeof r === 'string') // Filter out null/undefined/non-strings
        .map(r => r.trim().toUpperCase());

      const userRole =
        req.user?.role && typeof req.user.role === 'string'
          ? req.user.role.trim().toUpperCase()
          : null;

      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            message: 'Insufficient permissions',
            code: ERROR_CODES.INSUFFICIENT_PERMISSIONS
          }
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Auto-refresh access token on protected routes
 * This adds a new access token to the response headers if the current one is about to expire
 */
const autoRefreshToken = async (req, res, next) => {
  try {
    if (req.user) {
      // Check if current token is about to expire (in next 1 minute)
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      
      if (token) {
        try {
          const decoded = jwt.decode(token);
          if (decoded && decoded.exp) {
            const nowInSeconds = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = decoded.exp - nowInSeconds;
            
            // If token expires in less than 1 minute, refresh it
            if (timeUntilExpiry < 60) {
              const newToken = generateAccessToken(req.user);
              res.setHeader('X-New-Access-Token', newToken);
              res.setHeader('Access-Control-Expose-Headers', 'X-New-Access-Token');
              res.locals.newAccessToken = newToken;
              console.log(`Auto-refreshed token for user: ${req.user.email}`);
            }
          }
        } catch (error) {
          // Silent fail - don't break the request if token decode fails
          console.log('Token decode failed in auto-refresh:', error.message);
        }
      }
    }
    next();
  } catch (error) {
    console.error('Auto-refresh token error:', error);
    next(); // Continue even if auto-refresh fails
  }
};

/**
 * Development-friendly rate limiting middleware for auth endpoints
 */
const authRateLimiter = (req, res, next) => {
  // Skip rate limiting in development or if explicitly disabled
  if (process.env.NODE_ENV !== 'production' || process.env.DISABLE_RATE_LIMIT === 'true') {
    console.log('Rate limiting disabled for', req.path);
    return next();
  }
  
  // Production rate limiting
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // 100 requests per window
  
  // Simple in-memory rate limiting (use redis in production)
  if (!req.authAttempts) {
    req.authAttempts = {};
  }
  
  if (!req.authAttempts[ip]) {
    req.authAttempts[ip] = {
      count: 1,
      startTime: now
    };
  } else {
    // Reset if window has passed
    if (now - req.authAttempts[ip].startTime > windowMs) {
      req.authAttempts[ip] = {
        count: 1,
        startTime: now
      };
    } else {
      req.authAttempts[ip].count++;
    }
    
    // Check if limit exceeded
    if (req.authAttempts[ip].count > maxRequests) {
      console.log(`Rate limit exceeded for IP: ${ip} (${req.authAttempts[ip].count} requests)`);
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        error: {
          message: 'Too many requests. Please try again later.',
          code: ERROR_CODES.RATE_LIMIT
        }
      });
    }
  }
  
  next();
};

/**
 * Special rate limiter for refresh token endpoint only
 */
const refreshTokenRateLimiter = (req, res, next) => {
  // Skip rate limiting in development or if explicitly disabled
  if (process.env.NODE_ENV !== 'production' || process.env.DISABLE_RATE_LIMIT === 'true') {
    return next();
  }
  
  // Production rate limiting for refresh tokens - more strict
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes for refresh tokens
  const maxRequests = 10; // Only 10 refresh requests per 5 minutes
  
  if (!req.refreshAttempts) {
    req.refreshAttempts = {};
  }
  
  if (!req.refreshAttempts[ip]) {
    req.refreshAttempts[ip] = {
      count: 1,
      startTime: now
    };
  } else {
    // Reset if window has passed
    if (now - req.refreshAttempts[ip].startTime > windowMs) {
      req.refreshAttempts[ip] = {
        count: 1,
        startTime: now
      };
    } else {
      req.refreshAttempts[ip].count++;
    }
    
    // Check if limit exceeded
    if (req.refreshAttempts[ip].count > maxRequests) {
      console.log(`Refresh token rate limit exceeded for IP: ${ip}`);
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        error: {
          message: 'Too many refresh attempts. Please wait 5 minutes.',
          code: ERROR_CODES.RATE_LIMIT
        }
      });
    }
  }
  
  next();
};

/**
 * Get cooldown status (for debugging)
 */
const getCooldownStatus = () => {
  return {
    size: refreshCooldown.size,
    entries: Array.from(refreshCooldown.entries()).map(([userId, time]) => ({
      userId,
      time: new Date(time).toISOString(),
      age: Date.now() - time
    }))
  };
};

/**
 * Clear cooldown for a specific user (for debugging)
 */
const clearCooldown = (userId) => {
  refreshCooldown.delete(userId);
};

module.exports = {
  authenticate,
  authorize,
  autoRefreshToken,
  authRateLimiter,
  refreshTokenRateLimiter,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyRefreshToken,
  getCooldownStatus,
  clearCooldown
};
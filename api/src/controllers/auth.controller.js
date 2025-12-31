const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { 
  generateTokens, 
  verifyRefreshToken 
} = require('../middleware/auth.middleware');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');

class AuthController {
  /**
   * User login
   */
 async login(req, res) {
  try {
    const { email, password } = req.body;
    
    console.log(`Login attempt for email: ${email}`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: ERROR_CODES.INVALID_CREDENTIALS
        }
      });
    }

    // Check if user needs to set password
    if (!user.password || user.passwordReset) {
      console.log(`Password reset required for user: ${email}`);
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Please set your password',
        code: 'PASSWORD_RESET_REQUIRED',
        userId: user.id,
        passwordReset: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log(`Invalid password for user: ${email}`);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: ERROR_CODES.INVALID_CREDENTIALS
        }
      });
    }

    console.log(`Login successful for user: ${email}`);
    
    // Generate tokens
    const tokens = generateTokens(user);
    console.log(`Generated tokens for user: ${email}`);

    // Delete any existing refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id }
    });
    console.log(`Cleared old refresh tokens for user: ${email}`);

    // Store new refresh token
    try {
      const refreshTokenRecord = await prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });
      console.log(`Refresh token saved to database with ID: ${refreshTokenRecord.id}`);
    } catch (dbError) {
      console.error('Failed to save refresh token:', dbError);
      throw new Error('Failed to save authentication data');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: ERROR_CODES.INTERNAL_ERROR
      }
    });
  }
}

  /**
   * Set initial password (for users created by ADMIN)
   */
  async createPassword(req, res) {
    try {
      const { userId, password } = req.body;
      console.log(`Create password request for user ID: ${userId}`);

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.log(`User not found: ${userId}`);
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'User not found',
            code: ERROR_CODES.USER_NOT_FOUND
          }
        });
      }

      // Check if password already set
      if (user.password && !user.passwordReset) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Password already set',
            code: 'PASSWORD_ALREADY_SET'
          }
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(`Password hashed for user: ${user.email}`);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordReset: false
        }
      });
      console.log(`Password updated for user: ${user.email}`);

      // Generate tokens after password is set
      const tokens = generateTokens(user);
      console.log(`Generated tokens for user: ${user.email}`);

      // Store refresh token
      try {
        const refreshTokenRecord = await prisma.refreshToken.create({
          data: {
            token: tokens.refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });
        console.log(`Refresh token saved with ID: ${refreshTokenRecord.id}`);
      } catch (dbError) {
        console.error('Failed to save refresh token:', dbError);
        throw new Error('Failed to save authentication data');
      }

      const { password: _, ...userWithoutPassword } = user;

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password set successfully',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Set password error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      console.log('Refresh token request received');

      if (!refreshToken) {
        console.log('No refresh token provided');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Refresh token is required',
            code: 'REFRESH_TOKEN_REQUIRED'
          }
        });
      }

      console.log('Verifying refresh token...');
      
      // Verify refresh token
      const { user, refreshToken: tokenData } = await verifyRefreshToken(refreshToken);
      
      console.log(`Refresh token verified for user: ${user.email}, token ID: ${tokenData.id}`);

      // Generate new tokens
      const tokens = generateTokens(user);
      console.log('New tokens generated');

      console.log(`Deleting old refresh token: ${tokenData.id}`);
      
      // Delete old refresh token
      await prisma.refreshToken.delete({
        where: { id: tokenData.id }
      });

      console.log(`Creating new refresh token for user: ${user.email}`);
      
      // Store new refresh token
      try {
        const newTokenRecord = await prisma.refreshToken.create({
          data: {
            token: tokens.refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });
        console.log(`New refresh token saved with ID: ${newTokenRecord.id}`);
      } catch (dbError) {
        console.error('Failed to save new refresh token:', dbError);
        throw new Error('Failed to save authentication data');
      }

      console.log(`Token refresh successful for user: ${user.email}`);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      });

    } catch (error) {
      console.error('Refresh token error:', error.message);
      console.error('Error stack:', error.stack);
      
      let status = HTTP_STATUS.FORBIDDEN;
      let code = 'INVALID_REFRESH_TOKEN';
      let message = 'Invalid refresh token';

      if (error.message === 'Refresh token expired') {
        status = HTTP_STATUS.FORBIDDEN;
        code = 'REFRESH_TOKEN_EXPIRED';
        message = 'Refresh token expired';
      } else if (error.message === 'Refresh token not found') {
        status = HTTP_STATUS.FORBIDDEN;
        code = 'REFRESH_TOKEN_NOT_FOUND';
        message = 'Refresh token not found. Please login again.';
      } else if (error.message === 'Invalid refresh token format') {
        status = HTTP_STATUS.FORBIDDEN;
        code = 'INVALID_TOKEN_FORMAT';
        message = 'Invalid token format';
      } else if (error.name === 'JsonWebTokenError') {
        status = HTTP_STATUS.FORBIDDEN;
        code = 'INVALID_REFRESH_TOKEN';
        message = 'Invalid token';
      }

      return res.status(status).json({
        success: false,
        error: { message, code }
      });
    }
  }

  /**
   * Logout user (single device)
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      console.log('Logout request received');

      if (!refreshToken) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Refresh token is required',
            code: 'REFRESH_TOKEN_REQUIRED'
          }
        });
      }

      console.log('Deleting refresh token...');
      const result = await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });

      console.log(`Deleted ${result.count} refresh token(s)`);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logged out successfully',
        code: 'LOGOUT_SUCCESS'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(req, res) {
    try {
      const userId = req.user.id;
      console.log(`Logout all devices for user ID: ${userId}`);

      const result = await prisma.refreshToken.deleteMany({
        where: { userId }
      });

      console.log(`Deleted ${result.count} refresh tokens for user: ${userId}`);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logged out from all devices successfully',
        code: 'LOGOUT_ALL_SUCCESS'
      });
    } catch (error) {
      console.error('Logout all error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordReset: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'User not found',
            code: ERROR_CODES.USER_NOT_FOUND
          }
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile retrieved successfully',
        user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const { name, password } = req.body;
      const updateData = {};

      if (name) {
        updateData.name = name.trim();
        if (updateData.name.length === 0) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
              message: 'Name cannot be empty',
              code: ERROR_CODES.VALIDATION_ERROR
            }
          });
        }
      }
      
      if (password) {
        if (password.length < 6) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
              message: 'Password must be at least 6 characters',
              code: ERROR_CODES.VALIDATION_ERROR
            }
          });
        }
        updateData.password = await bcrypt.hash(password, 10);
        updateData.passwordReset = false; // User has set their password
      }

      // If no data to update
      if (Object.keys(updateData).length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'No data provided for update',
            code: ERROR_CODES.VALIDATION_ERROR
          }
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordReset: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.code === 'P2025') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'User not found',
            code: ERROR_CODES.USER_NOT_FOUND
          }
        });
      }

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Validate token (for checking if token is still valid)
   */
  async validateToken(req, res) {
    try {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Token is valid',
        valid: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('Validate token error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * DEBUG: Check refresh tokens in database
   */
  async debugRefreshTokens(req, res) {
    try {
      const tokens = await prisma.refreshToken.findMany({
        include: { 
          user: {
            select: {
              id: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        count: tokens.length,
        tokens: tokens.map(t => ({
          id: t.id,
          userId: t.userId,
          userEmail: t.user?.email,
          expiresAt: t.expiresAt,
          createdAt: t.createdAt,
          revoked: t.revoked,
          tokenPreview: t.token ? `${t.token.substring(0, 20)}...` : 'No token',
          isExpired: t.expiresAt < new Date()
        }))
      });
    } catch (error) {
      console.error('Debug error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }
}

module.exports = new AuthController();
const { prisma } = require('../config/database');
const { HTTP_STATUS, ERROR_CODES, PAGINATION } = require('../utils/constants');
const { sendWelcomeEmail } = require('../utils/emailService');

class UserController {
  /**
   * Create new user (admin only)
   */
  async createUser(req, res) {
    try {
      const { email, name, role = 'USER' } = req.body;
      
      console.log(`Admin creating user: ${email}, role: ${role}`);

      // Validate input
      if (!email || !name) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Email and name are required',
            code: ERROR_CODES.VALIDATION_ERROR
          }
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      });

      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: {
            message: 'User with this email already exists',
            code: ERROR_CODES.USER_ALREADY_EXISTS
          }
        });
      }

      // Create user WITHOUT password - user will set it on first login
      const newUser = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role: role.toUpperCase(),
          passwordReset: true, // Flag that user needs to set password
        },
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

      console.log(`✅ User created successfully: ${newUser.email}`);
      
      // ✅ FIXED: Send response immediately, then send email asynchronously
      const response = {
        success: true,
        message: 'User created successfully.',
        user: newUser,
        instructions: `Share these login instructions with ${newUser.name}:
1. Go to: ${process.env.CLIENT_URL || 'http://localhost:3000'}/login
2. Email: ${newUser.email}
3. Enter any password (will be prompted to set real password)
4. Follow the prompts to set password`
      };

      // Send email asynchronously (fire-and-forget)
      // Don't wait for email to complete before responding
      sendWelcomeEmail(newUser.email, newUser.name)
        .then(() => {
          console.log(`✅ Welcome email sent to ${newUser.email}`);
        })
        .catch(err => {
          console.error(`⚠️ Email sending failed for ${newUser.email} (non-critical):`, err.message);
        });

      // Return success immediately (don't wait for email)
      return res.status(HTTP_STATUS.CREATED).json(response);

    } catch (error) {
      console.error('❌ Create user error:', error);
      
      if (error.code === 'P2002') { // Prisma unique constraint error
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: {
            message: 'User with this email already exists',
            code: ERROR_CODES.USER_ALREADY_EXISTS
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
   * Get all users with pagination (admin only)
   */
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
      const role = req.query.role;
      const search = req.query.search;
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};
      
      if (role) {
        where.role = role;
      }
      
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Execute queries in parallel
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordReset: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                posts: true
              }
            }
          }
        }),
        prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      // Prevent admin from deleting themselves
      if (userId === req.user.id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Cannot delete your own account',
            code: 'SELF_DELETION_NOT_ALLOWED'
          }
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
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

      // Delete user (cascade will delete posts and refresh tokens)
      await prisma.user.delete({
        where: { id: userId }
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      
      if (error.code === 'P2025') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'User not found',
            code: ERROR_CODES.USER_NOT_FOUND
          }
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req, res) {
    try {
      const [postCounts] = await Promise.all([
        prisma.post.groupBy({
          by: ['status'],
          where: { userId: req.user.id },
          _count: { status: true }
        })
      ]);

      const stats = {
        totalPosts: postCounts.reduce((acc, curr) => acc + curr._count.status, 0),
        byStatus: postCounts.reduce((acc, curr) => {
          acc[curr.status.toLowerCase()] = curr._count.status;
          return acc;
        }, { pending: 0, approved: 0, rejected: 0 })
      };

      res.json({
        success: true,
        message: 'Statistics retrieved successfully',
        stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      console.log(`Updating user ${id} role to: ${role}`);

      // Validate role
      const validRoles = ['USER', 'ADMIN', 'EDITOR'];
      if (!validRoles.includes(role?.toUpperCase())) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Invalid role. Must be USER, ADMIN, or EDITOR',
            code: ERROR_CODES.VALIDATION_ERROR
          }
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id }
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

      // Update user role
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { 
          role: role.toUpperCase(),
          updatedAt: new Date()
        },
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

      console.log(`User role updated: ${updatedUser.email} -> ${updatedUser.role}`);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User role updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('Update user role error:', error);
      
      if (error.code === 'P2025') { // Record not found
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
}

module.exports = new UserController();
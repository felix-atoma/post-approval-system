const { prisma } = require('../config/database');
const { HTTP_STATUS, ERROR_CODES, PAGINATION } = require('../utils/constants');

class UserController {
  /**
   * Create new user (admin only)
   */
  async createUser(req, res) {
    try {
      const { email, name, role = 'USER' } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: {
            message: 'User already exists',
            code: ERROR_CODES.USER_EXISTS
          }
        });
      }

      const user = await prisma.user.create({
        data: {
          email,
          name,
          role,
          password: null,
          passwordReset: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordReset: true,
          createdAt: true
        }
      });

      res.status(HTTP_STATUS.CREATED).json({
        message: 'User created successfully. They will be prompted to set a password on first login.',
        user
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
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
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      
      if (error.code === 'P2025') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: {
            message: 'User not found',
            code: ERROR_CODES.USER_NOT_FOUND
          }
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
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
        message: 'Statistics retrieved successfully',
        stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }
}

module.exports = new UserController();
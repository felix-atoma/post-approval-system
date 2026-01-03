const { prisma } = require('../config/database');
const { HTTP_STATUS, ERROR_CODES, PAGINATION, POST_STATUS, USER_ROLES } = require('../utils/constants');

class PostController {
  async createPost(req, res) {
    try {
      const { title, content } = req.body;

      const post = await prisma.post.create({
        data: {
          title,
          content,
          userId: req.user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Post created successfully',
        post
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  async getMyPosts(req, res) {
    try {
      const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
      const status = req.query.status;
      const search = req.query.search;
      const skip = (page - 1) * limit;

      const where = { userId: req.user.id };
      
      if (status) {
        where.status = status;
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            reviewedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.post.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: 'Posts retrieved successfully',
        posts,
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
      console.error('Get posts error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  async getAllPosts(req, res) {
    try {
      // Check if user is admin or editor
      if (req.user.role !== USER_ROLES.ADMIN && req.user.role !== USER_ROLES.EDITOR) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            message: 'Insufficient permissions',
            code: ERROR_CODES.INSUFFICIENT_PERMISSIONS
          }
        });
      }

      const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
      const status = req.query.status;
      const userId = req.query.userId;
      const search = req.query.search;
      const skip = (page - 1) * limit;

      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (userId) {
        where.userId = userId;
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { user: { 
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }},
          { reviewedBy: { 
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }}
        ];
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            },
            reviewedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.post.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: 'Posts retrieved successfully',
        posts,
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
      console.error('Get admin posts error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  async getPostById(req, res) {
    try {
      const postId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!post) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
          }
        });
      }

      // Check permissions: Admin/Editor can view any post
      // User can view their own posts or approved posts from others
      if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.EDITOR) {
        if (post.userId !== userId && post.status !== POST_STATUS.APPROVED) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            error: {
              message: 'Post not found',
              code: ERROR_CODES.POST_NOT_FOUND
            }
          });
        }
      }

      res.json({
        success: true,
        message: 'Post retrieved successfully',
        post
      });
    } catch (error) {
      console.error('Get post error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const post = await prisma.post.findUnique({
        where: { id }
      });

      if (!post) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
          }
        });
      }

      // Check permissions
      if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.EDITOR && post.userId !== userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            message: 'You can only edit your own posts',
            code: ERROR_CODES.INSUFFICIENT_PERMISSIONS
          }
        });
      }

      // Check if post can be modified
      if (post.status !== POST_STATUS.PENDING) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Only pending posts can be edited',
            code: ERROR_CODES.POST_NOT_MODIFIABLE
          }
        });
      }

      // Update data
      const updateData = {};
      if (title !== undefined && title !== '') {
        updateData.title = title;
      }
      if (content !== undefined && content !== '') {
        updateData.content = content;
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

      const updatedPost = await prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Post updated successfully',
        post: updatedPost
      });

    } catch (error) {
      console.error('Update post error:', error);
      
      if (error.code === 'P2025') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
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

  async deletePost(req, res) {
    try {
      const postId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      const post = await prisma.post.findUnique({
        where: { id: postId }
      });

      if (!post) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
          }
        });
      }

      // Check permissions
      if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.EDITOR) {
        if (post.userId !== userId) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            error: {
              message: 'You can only delete your own posts',
              code: ERROR_CODES.INSUFFICIENT_PERMISSIONS
            }
          });
        }
        
        if (post.status !== POST_STATUS.PENDING) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
              message: 'Only pending posts can be deleted',
              code: ERROR_CODES.POST_NOT_MODIFIABLE
            }
          });
        }
      }

      await prisma.post.delete({
        where: { id: postId }
      });

      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Delete post error:', error);
      
      if (error.code === 'P2025') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
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

  async reviewPost(req, res) {
    try {
      const { status, rejectionReason } = req.body;
      const postId = req.params.id;

      const post = await prisma.post.findUnique({
        where: { id: postId }
      });

      if (!post) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
          }
        });
      }

      if (post.status !== POST_STATUS.PENDING) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Post has already been reviewed',
            code: ERROR_CODES.POST_ALREADY_REVIEWED,
            currentStatus: post.status
          }
        });
      }

      const updateData = { 
        status,
        reviewedById: req.user.id
      };
      
      if (status === POST_STATUS.REJECTED) {
        updateData.rejectionReason = rejectionReason || 'No reason provided';
      } else {
        updateData.rejectionReason = null;
      }

      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: `Post ${status.toLowerCase()} successfully`,
        post: updatedPost
      });
    } catch (error) {
      console.error('Review post error:', error);
      
      if (error.code === 'P2025') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
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
}

module.exports = new PostController();
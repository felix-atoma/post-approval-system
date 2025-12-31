const { prisma } = require('../config/database');
const { HTTP_STATUS, ERROR_CODES, PAGINATION, POST_STATUS } = require('../utils/constants');

class PostController {
  /**
   * Create a new post
   */
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
          }
        }
      });

      res.status(HTTP_STATUS.CREATED).json({
        message: 'Post created successfully',
        post
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Get user's posts with pagination and filtering
   */
  async getMyPosts(req, res) {
    try {
      const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
      const status = req.query.status;
      const search = req.query.search;
      const skip = (page - 1) * limit;

      // Build where clause
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

      // Execute queries in parallel
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
            }
          }
        }),
        prisma.post.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
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
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Get all posts for admin review
   */
  async getAllPosts(req, res) {
    try {
      const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
      const status = req.query.status;
      const userId = req.query.userId;
      const search = req.query.search;
      const skip = (page - 1) * limit;

      // Build where clause
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
          }}
        ];
      }

      // Execute queries in parallel
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
            }
          }
        }),
        prisma.post.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
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
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Get single post by ID
   */
  async getPostById(req, res) {
    try {
      const post = await prisma.post.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.role === 'ADMIN' ? undefined : req.user.id
        },
        include: {
          user: {
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
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
          }
        });
      }

      res.json({
        message: 'Post retrieved successfully',
        post
      });
    } catch (error) {
      console.error('Get post error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          message: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        }
      });
    }
  }

  /**
   * Update a post
   */
  async updatePost(req, res) {
    try {
      const { title, content } = req.body;
      const postId = req.params.id;

      // Check if post exists and is owned by user
      const existingPost = await prisma.post.findFirst({
        where: {
          id: postId,
          userId: req.user.id,
          status: POST_STATUS.PENDING
        }
      });

      if (!existingPost) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: {
            message: 'Post not found or cannot be modified',
            code: ERROR_CODES.POST_NOT_MODIFIABLE
          }
        });
      }

      const updateData = {};
      if (title) updateData.title = title;
      if (content) updateData.content = content;

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
          }
        }
      });

      res.json({
        message: 'Post updated successfully',
        post: updatedPost
      });
    } catch (error) {
      console.error('Update post error:', error);
      
      if (error.code === 'P2025') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
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
   * Delete a post
   */
  async deletePost(req, res) {
    try {
      const postId = req.params.id;

      // Check if post exists and is owned by user
      const existingPost = await prisma.post.findFirst({
        where: {
          id: postId,
          userId: req.user.id,
          status: POST_STATUS.PENDING
        }
      });

      if (!existingPost) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: {
            message: 'Post not found or cannot be deleted',
            code: ERROR_CODES.POST_NOT_MODIFIABLE
          }
        });
      }

      await prisma.post.delete({
        where: { id: postId }
      });

      res.json({
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Delete post error:', error);
      
      if (error.code === 'P2025') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
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
   * Review/Approve/Reject post (admin only)
   */
  async reviewPost(req, res) {
    try {
      const { status, rejectionReason } = req.body;
      const postId = req.params.id;

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId }
      });

      if (!post) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
          }
        });
      }

      // Check if post is already reviewed
      if (post.status !== POST_STATUS.PENDING) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: {
            message: 'Post has already been reviewed',
            code: ERROR_CODES.POST_ALREADY_REVIEWED,
            currentStatus: post.status
          }
        });
      }

      const updateData = { status };
      
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
          }
        }
      });

      res.json({
        message: `Post ${status.toLowerCase()} successfully`,
        post: updatedPost
      });
    } catch (error) {
      console.error('Review post error:', error);
      
      if (error.code === 'P2025') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: {
            message: 'Post not found',
            code: ERROR_CODES.POST_NOT_FOUND
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
}

module.exports = new PostController();
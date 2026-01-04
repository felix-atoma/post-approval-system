const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');

const app = express();

/* =======================
   SECURITY MIDDLEWARE
======================= */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    }
  })
);

/* =======================
   CORS CONFIGURATION
======================= */
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

/* =======================
   RATE LIMITING
======================= */
const isDevelopment = process.env.NODE_ENV === 'development';

// ✅ LENIENT rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDevelopment ? 1000 : 20, // 1000 in dev, 20 in prod
  message: {
    error: {
      message: 'Too many authentication requests, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment // ✅ Skip in development
});

// ✅ GENERAL rate limit for other endpoints
const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: isDevelopment ? 10000 : (Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100),
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment // ✅ Skip in development
});

// Apply lenient rate limiting to auth endpoints
app.use('/api/auth', authLimiter);

// Apply general rate limiting to all other API endpoints
app.use('/api/', generalLimiter);

/* =======================
   BODY PARSERS
======================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* =======================
   REQUEST LOGGING
======================= */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* =======================
   ROOT HEALTH CHECK
======================= */
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Post Management API is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

/* =======================
   API ROUTES
======================= */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

/* =======================
   EXTENDED HEALTH CHECK
======================= */
/* =======================
   EXTENDED HEALTH CHECK
======================= */
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { prisma } = require('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Post Management API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Post Management API',
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: error.message
    });
  }
});

/* =======================
   404 HANDLER
======================= */
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
      path: req.originalUrl
    }
  });
});

/* =======================
   GLOBAL ERROR HANDLER
======================= */
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  const statusCode = err.status || 500;

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      ...(isDevelopment && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
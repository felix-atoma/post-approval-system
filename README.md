# Post Management System

A full-stack post management application with role-based access control, JWT authentication with auto-refresh, and a comprehensive admin approval workflow.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.3.1-blue)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Testing](#-testing)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Features

- **User Authentication & Authorization**
  - JWT-based authentication with 5-minute token expiry
  - Automatic token refresh on every API request
  - Role-based access control (ADMIN, EDITOR, USER)
  - Secure password hashing with bcrypt

- **Admin Capabilities**
  - Create users without passwords (password setup on first login)
  - Approve or reject user posts with detailed reasons
  - User management (create, delete, view)
  - Post management dashboard with filters

- **User Capabilities**
  - Create and manage posts
  - View post approval status
  - See rejection reasons
  - Update profile information

- **Additional Features**
  - Responsive design (mobile, tablet, desktop)
  - Real-time pagination and filtering
  - Comprehensive validation and error handling
  - Email notifications (development mode ready)
  - RESTful API architecture

### Bonus Features

- ✅ Comprehensive test suite (46 tests)
- ✅ Database indexes for optimized queries
- ✅ Rate limiting for API endpoints
- ✅ Auto-refresh token mechanism
- ✅ Professional UI with Tailwind CSS

---

## 🛠️ Tech Stack

### Backend
- **Node.js** (v18+) - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **Prisma** - ORM and database toolkit
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Nodemailer** - Email service

### Frontend
- **React** (v18.3.1) - UI library
- **React Router** (v6) - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Testing & Development
- **Jest** - Testing framework
- **Supertest** - API testing
- **Nodemon** - Auto-restart during development

---

## 📁 Project Structure
```
post-management-system/
├── api/                          # Backend application
│   ├── prisma/
│   │   ├── migrations/           # Database migrations
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.js              # Database seeder
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   ├── controllers/         # Route controllers
│   │   ├── middleware/          # Express middleware
│   │   ├── routes/              # API routes
│   │   ├── utils/               # Utility functions
│   │   ├── app.js               # Express app setup
│   │   └── server.js            # Server entry point
│   ├── tests/                   # Test files
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── jest.config.js
│
├── app/                         # Frontend application
│   ├── public/                  # Static files
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── common/          # Reusable components
│   │   │   ├── layout/          # Layout components
│   │   │   └── posts/           # Post-related components
│   │   ├── contexts/            # React contexts
│   │   ├── hooks/               # Custom hooks
│   │   ├── pages/               # Page components
│   │   │   ├── admin/           # Admin pages
│   │   │   ├── auth/            # Auth pages
│   │   │   └── posts/           # Post pages
│   │   ├── services/            # API services
│   │   ├── utils/               # Utility functions
│   │   ├── App.jsx              # Main app component
│   │   └── index.js             # Entry point
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md                    # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **PostgreSQL** (v14.0 or higher)
- **Git**

To verify installations:
```bash
node --version    # Should be v18.0.0+
npm --version     # Should be v9.0.0+
psql --version    # Should be v14.0+
```

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/post-management-system.git
cd post-management-system
```

### 2. Setup Backend
```bash
cd api
npm install
```

### 3. Setup Frontend
```bash
cd ../app
npm install
```

### 4. Setup Database
```bash
# Create PostgreSQL database
createdb post_management_db

# Or using psql
psql -U postgres
CREATE DATABASE post_management_db;
\q
```

### 5. Run Migrations
```bash
cd api
npx prisma migrate dev
```

### 6. Seed Database
```bash
npm run seed
```

This creates default users:
- **Admin**: `admin@example.com` / `Admin123`
- **User**: `user@example.com` / `User123`

---

## 🔐 Environment Variables

### Backend (`api/.env`)
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/post_management_db?schema=public"

# JWT Secrets (Generate your own in production!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="5m"

# Server
PORT=5000
NODE_ENV="development"

# Email Configuration (Gmail example)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
APP_NAME="Post Management System"
CLIENT_URL="http://localhost:3000"

# CORS
FRONTEND_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (`app/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd api
npm run dev
```
Server runs on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd app
npm start
```
App runs on `http://localhost:3000`

### Production Mode

**Backend:**
```bash
cd api
npm start
```

**Frontend:**
```bash
cd app
npm run build
npm install -g serve
serve -s build -l 3000
```

---

## 🧪 Testing

### Run All Tests
```bash
cd api
npm test
```

### Run Specific Test Suite
```bash
# Auth tests
npm test -- auth.test.js

# Post tests
npm test -- posts.test.js
```

### Test Coverage
```bash
npm test -- --coverage
```

**Current Test Status:**
- ✅ 46 tests passing
- ✅ Authentication flow
- ✅ Post creation and approval
- ✅ User management
- ✅ Pagination and filtering

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST `/auth/login`
Login user and get JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "User123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": "5m",
  "user": {
    "id": "clxxx",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

#### POST `/auth/create-password`
Set password for newly created user.

**Request:**
```json
{
  "userId": "clxxx",
  "password": "NewPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password set successfully",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### POST `/auth/refresh-token`
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

#### POST `/auth/logout`
Logout from current device.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### Post Endpoints

#### POST `/posts`
Create a new post (authenticated users).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "title": "My Post Title",
  "content": "Post content here..."
}
```

#### GET `/posts/my-posts`
Get current user's posts with pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (PENDING/APPROVED/REJECTED)
- `search` (string): Search in title/content

**Example:**
```
GET /posts/my-posts?page=1&limit=10&status=PENDING&search=test
```

#### GET `/posts/admin/all`
Get all posts (admin/editor only).

**Query Parameters:** Same as above

#### PATCH `/posts/:id/review`
Approve or reject a post (admin/editor only).

**Request (Approve):**
```json
{
  "status": "APPROVED"
}
```

**Request (Reject):**
```json
{
  "status": "REJECTED",
  "rejectionReason": "Content does not meet guidelines"
}
```

#### PUT `/posts/:id`
Update a pending post.

#### DELETE `/posts/:id`
Delete a pending post.

### User Endpoints (Admin Only)

#### POST `/users`
Create a new user without password.

**Request:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "USER"
}
```

#### GET `/users`
Get all users with pagination and filtering.

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `role` (string): Filter by role
- `search` (string): Search by email/name

#### DELETE `/users/:id`
Delete a user.

#### PATCH `/users/:id/role`
Update user role.

**Request:**
```json
{
  "role": "EDITOR"
}
```

---

## 🗄️ Database Schema

### User Model
```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String
  password       String?
  role           Role     @default(USER)
  passwordReset  Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  posts          Post[]
  refreshTokens  RefreshToken[]
  reviewedPosts  Post[]   @relation("ReviewedBy")

  @@index([email])
  @@index([role])
}

enum Role {
  USER
  ADMIN
  EDITOR
}
```

### Post Model
```prisma
model Post {
  id               String     @id @default(cuid())
  title            String
  content          String     @db.Text
  status           PostStatus @default(PENDING)
  rejectionReason  String?    @db.Text
  userId           String
  reviewedById     String?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  user             User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviewedBy       User?      @relation("ReviewedBy", fields: [reviewedById], references: [id])

  @@index([userId])
  @@index([status])
  @@index([reviewedById])
  @@index([createdAt])
}

enum PostStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

## 🌐 Deployment

### Option 1: Vercel + Railway (Recommended)

#### 1. Deploy Database (Supabase)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string
4. Update DATABASE_URL in production

#### 2. Deploy Backend (Railway)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize and deploy
cd api
railway init
railway up

# Add environment variables in Railway dashboard
```

#### 3. Deploy Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd app
vercel

# Set environment variables in Vercel dashboard:
# REACT_APP_API_URL=https://your-api.railway.app/api
```

### Option 2: Render

1. **Database**: Use Render PostgreSQL
2. **Backend**: Deploy as Web Service
   - Build: `cd api && npm install && npx prisma migrate deploy`
   - Start: `cd api && npm start`
3. **Frontend**: Deploy as Static Site
   - Build: `cd app && npm install && npm run build`
   - Publish: `app/build`

### Post-Deployment Steps

1. Run database migrations:
```bash
npx prisma migrate deploy
```

2. Seed database:
```bash
npm run seed
```

3. Test deployed app:
   - Login with default credentials
   - Create a post
   - Test admin approval workflow

---

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt (10 rounds)
- CORS protection
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- SQL injection prevention (Prisma)
- XSS protection
- Secure HTTP headers

---

## 🎨 UI Features

- Responsive design (mobile-first)
- Dark mode support (optional)
- Loading states and skeletons
- Toast notifications
- Form validation with real-time feedback
- Pagination controls
- Search and filter components
- Role-based UI rendering

---

## 📝 Default Users

After running the seed script:

| Email | Password | Role | Access |
|-------|----------|------|--------|
| admin@example.com | Admin123 | ADMIN | Full access |
| user@example.com | User123 | USER | Create posts |

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Reset database
npx prisma migrate reset
npm run seed
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
```

### JWT Token Issues
```bash
# Clear tokens in browser
localStorage.clear()

# Generate new secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Test Failures
```bash
# Clean test database
node tests/clean-test-db.js

# Run tests
npm test
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use ESLint configuration
- Follow Airbnb style guide
- Write meaningful commit messages
- Add tests for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - [GitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- [Prisma](https://www.prisma.io/) - Amazing database toolkit
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Express](https://expressjs.com/) - Web framework

---

## 📞 Support

For support, email support@example.com or open an issue in the repository.

---

## 🗺️ Roadmap

- [ ] Real-time notifications with WebSockets
- [ ] File upload for post attachments
- [ ] Advanced analytics dashboard
- [ ] Email templates with MJML
- [ ] Two-factor authentication
- [ ] Social media login (OAuth)
- [ ] API documentation with Swagger
- [ ] Docker containerization

---

**Built with ❤️ using Node.js, React, and PostgreSQL**
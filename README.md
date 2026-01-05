# Post Management System

A full-stack post management application with role-based access control, JWT authentication with auto-refresh, and a comprehensive admin approval workflow.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.3.1-blue)
![PostgreSQL](https://img.shields.io/badge/postgresql-14%2B-blue)

---

## 🌐 Live Demo

- **Frontend (App):** [https://post-approval-system.vercel.app](https://post-approval-system.vercel.app)
- **Backend (API):** [https://post-approval-system-1.onrender.com](https://post-approval-system-1.onrender.com)
- **API Health Check:** [https://post-approval-system-1.onrender.com/api/health](https://post-approval-system-1.onrender.com/api/health)

---

## 👤 Demo Accounts

Test the application with these pre-seeded accounts:

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| `admin@system.local` | `Admin@123` | ADMIN | Full system access |
| `admin@example.com` | `admin123` | ADMIN | Full system access |
| `user@example.com` | `user123` | USER | Create & manage posts |
| `user2@example.com` | `user456` | USER | Create & manage posts |
| `newuser@example.com` | *(Set on first login)* | USER | Password setup required |
| `guest@example.com` | *(Set on first login)* | USER | Password setup required |

**Note:** Users without passwords will be prompted to create one upon first login.

---

## ✨ Features

### Core Features (100% Complete)

#### User Authentication & Authorization
- ✅ JWT-based authentication with 5-minute token expiry
- ✅ Automatic token refresh on every API request
- ✅ Role-based access control (ADMIN, EDITOR, USER)
- ✅ Secure password hashing with bcrypt (10 rounds)
- ✅ Password setup flow for admin-created users

#### Admin Capabilities
- ✅ Create users without passwords (users set password on first login)
- ✅ Approve or reject user posts with mandatory rejection reasons
- ✅ User management dashboard (create, delete, view users)
- ✅ Post management dashboard with advanced filters
- ✅ Real-time statistics and analytics
- ✅ Role management (promote/demote users)

#### User Capabilities
- ✅ Create and manage posts
- ✅ View post approval status in real-time
- ✅ See detailed rejection reasons
- ✅ Edit pending posts
- ✅ Delete pending/rejected posts
- ✅ Personal dashboard with post statistics

#### Additional Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Real-time pagination and filtering
- ✅ Comprehensive validation and error handling
- ✅ Email notifications (development mode ready)
- ✅ RESTful API architecture
- ✅ Rate limiting for security
- ✅ Auto-refresh token mechanism

### Bonus Features (Complete)

- ✅ **Comprehensive test suite** (46 tests passing)
- ✅ **Database indexes** for optimized queries
- ✅ **Professional UI** with Tailwind CSS
- ✅ **Loading states** and error boundaries
- ✅ **Toast notifications** for user feedback

---

## 🛠️ Tech Stack

### Backend
- **Node.js** (v18+) - Runtime environment
- **Express.js** (v4.18.2) - Web framework
- **PostgreSQL** (Neon) - Relational database
- **Prisma** (v5.7.0) - ORM and database toolkit
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Nodemailer** - Email service
- **Jest & Supertest** - Testing framework

### Frontend
- **React** (v18.3.1) - UI library
- **React Router** (v6) - Client-side routing
- **Vite** (v6.0.11) - Build tool and dev server
- **Tailwind CSS** (v4.1.18) - Utility-first CSS
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icon library
- **date-fns** - Date formatting

### Infrastructure
- **Render** - Backend hosting
- **Vercel** - Frontend hosting
- **Neon** - PostgreSQL database hosting
- **GitHub** - Version control

---

## 📁 Project Structure
```
post-approval-system/
├── api/                          # Backend application
│   ├── prisma/
│   │   ├── migrations/           # Database migrations
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.js              # Database seeder
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   │   └── database.js      # Prisma client
│   │   ├── controllers/         # Route controllers
│   │   │   ├── auth.controller.js
│   │   │   ├── post.controller.js
│   │   │   └── user.controller.js
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── validation.middleware.js
│   │   ├── routes/              # API routes
│   │   │   ├── auth.routes.js
│   │   │   ├── post.routes.js
│   │   │   └── user.routes.js
│   │   ├── utils/               # Utility functions
│   │   │   ├── constants.js
│   │   │   └── emailService.js
│   │   ├── app.js               # Express app setup
│   │   └── server.js            # Server entry point
│   ├── tests/                   # Test files
│   │   ├── auth.test.js
│   │   └── posts.test.js
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
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/               # Custom hooks
│   │   │   └── useAuth.js
│   │   ├── pages/               # Page components
│   │   │   ├── admin/           # Admin pages
│   │   │   ├── auth/            # Auth pages
│   │   │   └── posts/           # Post pages
│   │   ├── services/            # API services
│   │   │   ├── api.js
│   │   │   ├── auth.service.js
│   │   │   ├── post.service.js
│   │   │   └── user.service.js
│   │   ├── utils/               # Utility functions
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── .env                     # Environment variables
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md                    # This file
```

---

## 🚀 Installation & Local Development

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **PostgreSQL** (v14.0 or higher) - Optional for local development
- **Git**

### Quick Start

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/post-approval-system.git
cd post-approval-system
```

#### 2. Setup Backend
```bash
cd api
npm install
```

**Create `.env` file:**
```env
# Database - Use Neon or local PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/database?sslmode=require"

# JWT Secrets (generate your own!)
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRES_IN="5m"

# Server
PORT=5000
NODE_ENV="development"

# Email Configuration
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

**Run migrations and seed:**
```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

**Start backend:**
```bash
npm run dev
# Server runs on http://localhost:5000
```

#### 3. Setup Frontend
```bash
cd ../app
npm install
```

**Create `.env` file:**
```env
VITE_API_URL=http://localhost:5000/api
```

**Start frontend:**
```bash
npm run dev
# App runs on http://localhost:3000
```

---

## 🧪 Testing

### Run All Tests
```bash
cd api
npm test
```

**Expected Output:**
```
Test Suites: 2 passed, 2 total
Tests:       46 passed, 46 total
```

### Run Specific Test Suite
```bash
npm run test:auth    # Authentication tests
npm run test:posts   # Post management tests
```

### Test Coverage
```bash
npm test -- --coverage
```

---

## 📚 API Documentation

### Base URL

**Production:** `https://post-approval-system-1.onrender.com/api`  
**Local:** `http://localhost:5000/api`

### Authentication Endpoints

#### POST `/auth/login`
Login user and receive JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": "5m",
  "user": {
    "id": "clxxx",
    "email": "user@example.com",
    "name": "User Name",
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

#### POST `/auth/refresh-token`
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### Post Endpoints

#### POST `/posts`
Create a new post (authenticated users).

**Headers:** `Authorization: Bearer <accessToken>`

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
- `status` (string): Filter by PENDING/APPROVED/REJECTED
- `search` (string): Search in title/content

**Example:** `GET /posts/my-posts?page=1&limit=10&status=PENDING`

#### GET `/posts/admin/all` (Admin/Editor only)
Get all posts with pagination and filters.

#### PATCH `/posts/:id/review` (Admin/Editor only)
Approve or reject a post.

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
- `page`, `limit`, `role`, `search`

#### DELETE `/users/:id`
Delete a user (cannot delete self).

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
model user {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String
  password       String?
  role           Role     @default(USER)
  passwordReset  Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([email])
  @@index([role])
}
```

### Post Model
```prisma
model post {
  id               String     @id @default(cuid())
  title            String     @db.VarChar(200)
  content          String
  status           PostStatus @default(PENDING)
  rejectionReason  String?
  userId           String
  reviewedById     String?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

### Enums
```prisma
enum Role {
  ADMIN
  USER
  EDITOR
}

enum PostStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

## 🌐 Deployment

### Backend (Render)

**Deployed at:** [https://post-approval-system-1.onrender.com](https://post-approval-system-1.onrender.com)

**Configuration:**
- **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command:** `npm start`
- **Environment:** Node.js
- **Instance:** Free tier

### Frontend (Vercel)

**Deployed at:** [https://post-approval-system.vercel.app](https://post-approval-system.vercel.app)

**Configuration:**
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Database (Neon)

**PostgreSQL serverless database with:**
- Connection pooling
- Automatic backups
- SSL/TLS encryption
- 10GB free tier storage

---

## 🔒 Security Features

- ✅ JWT-based authentication with refresh tokens
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ CORS protection
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ Secure HTTP headers (Helmet)

---

## 📊 Performance Optimizations

- ✅ Database indexes on frequently queried fields
- ✅ Connection pooling with PgBouncer
- ✅ Lazy loading and code splitting
- ✅ Optimized bundle size with Vite
- ✅ Efficient pagination queries
- ✅ Debounced search inputs
- ✅ Memoized React components

---

## 🎨 UI/UX Features

- ✅ Responsive design (mobile-first approach)
- ✅ Loading states and skeletons
- ✅ Toast notifications for user feedback
- ✅ Form validation with real-time error display
- ✅ Intuitive navigation and routing
- ✅ Search and filter components
- ✅ Role-based UI rendering
- ✅ Accessibility considerations

---

## 🐛 Known Issues & Limitations

- ⚠️ Render free tier may have cold starts (first request takes ~30s)
- ⚠️ Email sending in production requires SMTP configuration
- ℹ️ Database connection pooling limited on free tier

---

## 🔄 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] File upload for post attachments
- [ ] Advanced analytics dashboard
- [ ] Two-factor authentication (2FA)
- [ ] Social media login (OAuth)
- [ ] API documentation with Swagger
- [ ] Docker containerization
- [ ] Automated deployment pipelines

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Felix Atoma**

- Email: felixatoma@gmail.com
- GitHub: [Your GitHub Profile](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- [Prisma](https://www.prisma.io/) - Database toolkit
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Express](https://expressjs.com/) - Web framework
- [Render](https://render.com/) - Backend hosting
- [Vercel](https://vercel.com/) - Frontend hosting
- [Neon](https://neon.tech/) - PostgreSQL hosting

---

## 📞 Support

For issues or questions:
1. Check the [GitHub Issues](https://github.com/yourusername/post-approval-system/issues)
2. Email: felixatoma@gmail.com

---

## ⚡ Quick Commands Reference
```bash
# Backend
cd api
npm install          # Install dependencies
npm run dev          # Start development server
npm test            # Run tests
npm run seed        # Seed database
npx prisma studio   # Open Prisma Studio

# Frontend
cd app
npm install         # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build

# Database
npx prisma migrate dev      # Create new migration
npx prisma migrate deploy   # Deploy migrations
npx prisma generate        # Generate Prisma Client
```

---

**Built with ❤️ using Node.js, React, PostgreSQL, and Prisma**

**Project completed: January 2026**
```

---

## 📋 **Additional Files to Include**

### **Create `LICENSE` file:**
```
MIT License

Copyright (c) 2026 Felix Atoma

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### **Create `.gitignore` (root):**
```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment
.env
.env.local
.env.production

# Build outputs
dist/
build/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Prisma
*.db
*.db-journal

# Test coverage
coverage/
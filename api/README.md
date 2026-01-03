# Post Management API

Backend API for the Post Management System with authentication, user management, and post review functionality.

## Features

- JWT Authentication with 5-minute token expiry
- Automatic token refresh on activity
- Role-based access control (Admin/User)
- User management (Admin only)
- Post creation and review system
- Pagination and filtering
- Input validation and error handling

## Tech Stack

- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT for authentication
- Jest for testing

## Setup

1. Install dependencies: `npm install`
2. Create `.env` file from `.env.example`
3. Setup database: `npm run prisma:migrate`
4. Seed database: `npm run prisma:seed`
5. Start server: `npm run dev`

## API Documentation

See `API.md` for detailed endpoint documentation.

## Testing

Run tests: `npm test`
Watch mode: `npm run test:watch`
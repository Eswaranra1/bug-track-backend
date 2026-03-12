<div align="center">

# 🐛 BugTrack — Backend API

**A RESTful backend for a full-stack bug tracking application**  
Built with Node.js · Express · MongoDB · JWT Authentication

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![JWT](https://img.shields.io/badge/JWT-Auth-FB015B?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](https://opensource.org/licenses/ISC)

</div>

---

## 📖 Overview

**BugTrack Backend** is a production-ready REST API that powers a bug tracking system. It handles user authentication (register, login, password reset via email) and full CRUD operations for bug reports — all protected by JWT-based authorization.

> **Paired Frontend**: This backend is designed to work alongside the BugTrack React frontend.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Stateless auth using signed JSON Web Tokens |
| 📧 **Password Reset via Email** | Secure token-based forgot/reset password flow using Nodemailer + Gmail |
| 🐛 **Bug CRUD** | Create, read, update, and delete bug reports |
| 👤 **User Isolation** | Each user only sees their own bugs |
| 🔒 **Bcrypt Hashing** | All passwords hashed with bcryptjs (salt rounds: 10) |
| 🌐 **CORS Ready** | Cross-origin resource sharing enabled for frontend integration |

---

## 🏗️ Architecture

```
bug-track-backend/
├── config/
│   └── db.js                   # MongoDB connection via Mongoose
├── controllers/
│   ├── authController.js       # Register, Login, Forgot/Reset Password
│   └── bugController.js        # Bug CRUD business logic
├── middleware/
│   └── authMiddleware.js       # JWT token verification
├── models/
│   ├── User.js                 # User schema (name, email, password, reset tokens)
│   └── Bug.js                  # Bug schema (title, description, priority, status)
├── routes/
│   ├── authRoutes.js           # /api/auth/* routes
│   └── bugRoutes.js            # /api/bugs/* routes (protected)
├── server.js                   # App entry point — sets up Express + routes
├── .env                        # Environment variables (not committed)
└── package.json
```

---

## 🗃️ Data Models

### User
| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Required, unique |
| `password` | String | Required, bcrypt-hashed |
| `resetPasswordToken` | String | SHA-256 hashed token for reset flow |
| `resetPasswordExpires` | Date | 1-hour TTL for reset token |
| `createdAt / updatedAt` | Date | Auto-generated (timestamps) |

### Bug
| Field | Type | Notes |
|---|---|---|
| `title` | String | Required |
| `description` | String | Optional |
| `priority` | String | `low` \| `medium` \| `high` \| `critical` — default: `medium` |
| `status` | String | `open` \| `in-progress` \| `resolved` \| `closed` — default: `open` |
| `createdBy` | ObjectId | Ref → User |
| `createdAt / updatedAt` | Date | Auto-generated (timestamps) |

---

## 🔌 API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ Public | Register a new user |
| `POST` | `/api/auth/login` | ❌ Public | Login; returns JWT token |
| `POST` | `/api/auth/forgot-password` | ❌ Public | Send password reset email |
| `POST` | `/api/auth/reset-password/:token` | ❌ Public | Reset password with token |

### Bugs — `/api/bugs` *(all require Authorization header)*

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/bugs` | ✅ Required | Create a new bug report |
| `GET` | `/api/bugs` | ✅ Required | Get all bugs for authenticated user |
| `PUT` | `/api/bugs/:id` | ✅ Required | Update a bug by ID |
| `DELETE` | `/api/bugs/:id` | ✅ Required | Delete a bug by ID |

### Authorization Header Format

```
Authorization: <your_jwt_token>
```

> ⚠️ **Note:** The token is sent as a raw value in the `Authorization` header (no `Bearer ` prefix).

---

## 📋 Example Request & Response

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "mypassword"
}
```
```json
{ "message": "User registered successfully" }
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "mypassword"
}
```
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

### Create a Bug
```http
POST /api/bugs
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Login button not working on mobile",
  "description": "Tapping login does nothing on iOS Safari.",
  "priority": "high",
  "status": "open"
}
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Email (Gmail)
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend URL (for password reset links)
CLIENT_URL=http://localhost:3000
```

> 💡 `EMAIL_PASS` should be a **Gmail App Password**, not your Google account password.  
> Enable it at: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

---

## 🚀 Quick Start

> See **[GETTING_STARTED.md](./GETTING_STARTED.md)** for a detailed, step-by-step setup guide.

```bash
# 1. Clone & install
git clone https://github.com/Eswaranra1/bug-track-backend.git
cd bug-track-backend
npm install

# 2. Configure environment
cp .env.example .env   # then fill in your values

# 3. Run in development
npm run dev

# 4. Run in production
npm start
```

The API will be available at `http://localhost:5000`.

---

## 🛠️ Tech Stack

| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.2.1 | HTTP server framework |
| `mongoose` | ^9.3.0 | MongoDB ODM |
| `jsonwebtoken` | ^9.0.3 | JWT creation & verification |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `nodemailer` | ^8.0.2 | Email delivery |
| `dotenv` | ^17.3.1 | Environment variable loading |
| `cors` | ^2.8.6 | Cross-origin request handling |
| `nodemon` | ^3.1.14 | Dev server auto-reload |

---

## 📄 License

[ISC](https://opensource.org/licenses/ISC) © Eswaranra1

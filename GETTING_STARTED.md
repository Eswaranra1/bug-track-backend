# 🚀 Getting Started with BugTrack Backend

This guide walks you through everything you need to set up and run the BugTrack API on your local machine from scratch.

---

## ✅ Prerequisites

Make sure you have the following installed before proceeding:

| Tool | Version | Download |
|---|---|---|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **npm** | 8+ | Comes with Node.js |
| **Git** | Any | [git-scm.com](https://git-scm.com) |
| **MongoDB Atlas account** | — | [mongodb.com/atlas](https://www.mongodb.com/atlas) |
| **Resend account** | — | For email (password reset) — [resend.com](https://resend.com) |

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/Eswaranra1/bug-track-backend.git
cd bug-track-backend
```

---

## Step 2 — Install Dependencies

```bash
npm install
```

This installs all required packages listed in `package.json`.

---

## Step 3 — Set Up MongoDB

You can use **MongoDB Atlas** (cloud, free tier) or a local MongoDB instance.

### Option A: MongoDB Atlas (Recommended)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a **new cluster** (free M0 tier is fine).
3. Under **Database Access**, create a database user with a username and password.
4. Under **Network Access**, add your IP address (or `0.0.0.0/0` for development).
5. Click **Connect → Connect your application** and copy the connection string.

It will look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
```

### Option B: Local MongoDB

Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) and use:
```
MONGO_URI=mongodb://localhost:27017/bugtrack
```

---

## Step 4 — Set Up Resend (for Email Feature)

The password reset feature sends emails via [Resend](https://resend.com).

1. Sign up at [resend.com](https://resend.com).
2. Go to **API Keys** and create a key (e.g. "BugTrack").
3. Copy the key (starts with `re_`). You will add it to `.env` as `RESEND_API_KEY`.
4. (Optional) To send to any email address, verify a domain under **Domains**. Otherwise you can use `onboarding@resend.dev` (free tier may limit recipients).

---

## Step 5 — Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Windows (PowerShell)
New-Item .env -ItemType File

# Mac / Linux
touch .env
```

Open `.env` and paste the following, replacing the placeholder values:

```env
# Server
PORT=5000

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/bugtrack?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM=BugTrack <onboarding@resend.dev>

# Frontend URL (used in password reset emails)
CLIENT_URL=http://localhost:5173
```

> ⚠️ **Never commit `.env` to Git.** It's already listed in `.gitignore`.

---

## Step 6 — Run the Server

### Development mode (auto-reloads on file changes)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

You should see:
```
MongoDB Connected
Server running on port 5000
```

Visit `http://localhost:5000` in your browser — you should see:
```
BugTrack API Running
```

---

## Step 7 — Test the API

You can test endpoints using [Postman](https://www.postman.com), [Insomnia](https://insomnia.rest), or `curl`.

### Register a user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

Expected response:
```json
{ "message": "User registered successfully" }
```

### Login and get a token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected response:
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5..." }
```

### Create a bug report

Copy the token from the login response and replace `<YOUR_TOKEN>` below:

```bash
curl -X POST http://localhost:5000/api/bugs \
  -H "Content-Type: application/json" \
  -H "Authorization: <YOUR_TOKEN>" \
  -d '{"title":"Button broken","description":"Submit does nothing","priority":"high","status":"open"}'
```

### Get all your bugs

```bash
curl http://localhost:5000/api/bugs \
  -H "Authorization: <YOUR_TOKEN>"
```

---

## 📁 Project Structure Reference

```
bug-track-backend/
├── config/db.js          → MongoDB connection
├── controllers/
│   ├── authController.js → Register, Login, Forgot/Reset Password
│   └── bugController.js  → Create, Get, Update, Delete bugs
├── middleware/
│   └── authMiddleware.js → JWT verification (guards protected routes)
├── models/
│   ├── User.js           → User schema
│   └── Bug.js            → Bug schema
├── routes/
│   ├── authRoutes.js     → /api/auth/*
│   └── bugRoutes.js      → /api/bugs/* (all protected)
└── server.js             → Express app entry point
```

---

## 🐛 Troubleshooting

| Issue | Likely Cause | Fix |
|---|---|---|
| `MongoNetworkError` | Wrong `MONGO_URI` or IP not whitelisted | Double-check Atlas Network Access |
| `CastError` or auth fails | Missing or wrong JWT | Ensure `JWT_SECRET` matches between `.env` and the token that was signed |
| `Invalid credentials` | Wrong password | Re-check what you registered with |
| Email not sent | Wrong or missing `RESEND_API_KEY` | Check API key at [resend.com](https://resend.com) |
| `No token` (401) | Missing Authorization header | Always pass the JWT in the `Authorization` header |
| Port already in use | Another server on port 5000 | Change `PORT` in `.env` |

---

## 🔗 Related Resources

- [Express.js Docs](https://expressjs.com/en/5x/api.html)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [MongoDB Atlas Guide](https://www.mongodb.com/docs/atlas/getting-started/)
- [JWT Introduction](https://jwt.io/introduction)
- [Resend Docs](https://resend.com/docs)

---

> Back to [README.md](./README.md)

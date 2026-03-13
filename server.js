const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();
const path = require("path");
const connectDB = require("./config/db");
const { authLimiter } = require("./middleware/rateLimitMiddleware");

connectDB();
const authRoutes = require("./routes/authRoutes");
const bugRoutes = require("./routes/bugRoutes");
const teamRoutes = require("./routes/teamRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const commentRoutes = require("./routes/commentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

// Trust proxy (Render, etc.) so req.protocol and X-Forwarded-Proto are correct; avoids mixed-content block on reset-password page.
app.set("trust proxy", 1);

// Allow frontend origin(s). No trailing slash. On Render set CLIENT_URL=https://bug-track-frontend.vercel.app
function normalizeOrigin(url) {
  if (!url || typeof url !== "string") return "";
  return url.replace(/\/+$/, "");
}
const allowedOrigins = [
  normalizeOrigin(process.env.CLIENT_URL),
  "https://bug-track-frontend.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalized)) return callback(null, origin);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/activity", activityRoutes);

app.get("/", (req, res) => {
  res.send("BugTrack API Running");
});

// API 404: no route matched
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Global error handler: sanitize messages in production, handle multer/file errors
app.use((err, req, res, next) => {
  if (err.message && (err.message.includes("allowed") || err.code === "LIMIT_FILE_SIZE")) {
    return res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "File too large (max 5MB)" : "Invalid file type. Only images and PDFs are allowed." });
  }
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";
  const message = isProd && status === 500 ? "Server error" : (err.message || "Server error");
  if (status >= 500) console.error(err);
  res.status(status).json({ message });
});

const { DEFAULT_PORT } = require("./config/constants");
const PORT = process.env.PORT || DEFAULT_PORT;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

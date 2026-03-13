const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

connectDB();
const authRoutes = require("./routes/authRoutes");
const bugRoutes = require("./routes/bugRoutes");

const app = express();

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
app.use("/api/auth", authRoutes);
app.use("/api/bugs", bugRoutes);

app.get("/", (req, res) => {
  res.send("BugTrack API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

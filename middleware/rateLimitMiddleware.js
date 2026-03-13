const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: "Too many password reset requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, forgotPasswordLimiter };

const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { forgotPasswordLimiter } = require("../middleware/rateLimitMiddleware");
const { validate, registerSchema, loginSchema, forgotPasswordSchema } = require("../middleware/validateMiddleware");

const { register, login, forgotPassword, resetPassword, getResetPasswordPage, testEmail, getMe } = require("../controllers/authController");

router.get("/me", auth, getMe);
router.get("/test-email",       testEmail);
router.post("/register",        validate(registerSchema), register);
router.post("/login",           validate(loginSchema), login);
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.get("/reset-password/:token",  getResetPasswordPage);
router.post("/reset-password/:token", resetPassword);

module.exports = router;

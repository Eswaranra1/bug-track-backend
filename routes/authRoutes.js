const express = require("express");
const router = express.Router();

const { register, login, forgotPassword, resetPassword, testEmail } = require("../controllers/authController");

router.get("/test-email",       testEmail);
router.post("/register",        register);
router.post("/login",           login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;

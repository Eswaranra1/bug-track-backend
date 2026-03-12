const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/* ── Nodemailer transporter ────────────────────────────────── */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ── Register ──────────────────────────────────────────────── */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Login ─────────────────────────────────────────────────── */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Forgot Password ───────────────────────────────────────── */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return success anyway to avoid email enumeration
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Save hashed token + 1-hour expiry to user
    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Dynamically get the frontend URL so this works on laptop, mobile, and Vercel!
    const clientUrl = req.headers.origin || process.env.CLIENT_URL || "http://localhost:5173";

    // Build the reset URL (uses raw token in URL, hashed one in DB)
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    // Send email
    await transporter.sendMail({
      from: `"BugTrack" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset your BugTrack password",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#10141f;border-radius:16px;color:#f0f4ff;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🐛</div>
            <span style="font-size:20px;font-weight:700;">BugTrack</span>
          </div>
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">Reset your password</h2>
          <p style="color:#94a3b8;margin:0 0 28px;font-size:14px;line-height:1.6;">
            We received a request to reset the password for your BugTrack account.
            Click the button below to choose a new password. This link expires in <strong style="color:#f0f4ff;">1 hour</strong>.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
            Reset Password →
          </a>
          <p style="margin-top:28px;font-size:12px;color:#475569;">
            If you didn't request this, you can safely ignore this email.
            Your password will remain unchanged.
          </p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:24px 0;"/>
          <p style="font-size:11px;color:#475569;">
            Can't click the button? Copy this link:<br/>
            <a href="${resetUrl}" style="color:#818cf8;word-break:break-all;">${resetUrl}</a>
          </p>
        </div>
      `,
    });

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ message: "Failed to send reset email. Check your email config." });
  }
};

/* ── Reset Password ────────────────────────────────────────── */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Hash the incoming raw token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // must not be expired
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    // Update password and clear token fields
    user.password             = await bcrypt.hash(password, 10);
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now sign in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
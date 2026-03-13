const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM || "BugTrack <onboarding@resend.dev>";

/** Send email via Resend. Throws if RESEND_API_KEY is missing or send fails. */
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: Array.isArray(to) ? to : [to],
    subject,
    ...(html && { html }),
    ...(text && { text }),
  });
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data;
}

/* ── Test Email ────────────────────────────────────────────── */
exports.testEmail = async (req, res) => {
  try {
    const to = process.env.RESEND_TEST_TO || process.env.EMAIL_USER;
    if (!to)
      return res
        .status(400)
        .send("Set RESEND_TEST_TO or EMAIL_USER in .env for test recipient.");
    await sendEmail({
      to,
      subject: "BugTrack Email Test",
      text: "Email working!",
    });
    res.send("Email sent successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

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
      return res.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Save hashed token + 1-hour expiry to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Reset link points to backend (e.g. https://bug-track-backend-jz4l.onrender.com/api/auth/reset-password/TOKEN)
    const apiBase =
      process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${apiBase.replace(/\/+$/, "")}/api/auth/reset-password/${rawToken}`;

    const html = `
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
      `;
    await sendEmail({
      to: user.email,
      subject: "Reset your BugTrack password",
      html,
    });

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res
      .status(500)
      .json({
        message:
          "Failed to send reset email. Check RESEND_API_KEY and Resend dashboard.",
      });
  }
};

/* ── Reset Password page (GET) ───────────────────────────── */
exports.getResetPasswordPage = (req, res) => {
  const token = req.params.token;
  const apiBase = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
  const actionUrl = `${apiBase.replace(/\/+$/, "")}/api/auth/reset-password/${encodeURIComponent(token)}`;
  const loginUrl = process.env.CLIENT_URL || "http://localhost:5173";
  res.setHeader("Content-Type", "text/html");
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Choose a new password – BugTrack</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f1f5f9; min-height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .card { background: #1e293b; border-radius: 16px; padding: 32px; max-width: 420px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.2); }
    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .brand-icon { width: 36px; height: 36px; background: linear-gradient(135deg,#6366f1,#8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .brand-text { font-size: 1.25rem; font-weight: 700; }
    h1 { margin: 0 0 6px; font-size: 1.5rem; font-weight: 700; }
    .hint { color: #94a3b8; font-size: 14px; margin: 0 0 24px; }
    .field { margin-bottom: 18px; }
    .field label { display: block; font-size: 13px; font-weight: 500; color: #cbd5e1; margin-bottom: 6px; }
    .input-wrap { position: relative; }
    .input-wrap input { width: 100%; padding: 12px 44px 12px 14px; border-radius: 10px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 15px; }
    .input-wrap input:focus { outline: none; border-color: #6366f1; }
    .toggle-vis { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; display: inline-flex; align-items: center; justify-content: center; }
    .toggle-vis:hover { color: #f1f5f9; }
    .toggle-vis svg { width: 20px; height: 20px; }
    .btn { width: 100%; padding: 14px; border-radius: 10px; border: none; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-weight: 600; cursor: pointer; font-size: 15px; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .msg { margin-top: 14px; font-size: 14px; }
    .msg.err { color: #f87171; }
    .msg.ok { color: #4ade80; }
    .back { display: block; text-align: center; margin-top: 20px; font-size: 14px; color: #94a3b8; text-decoration: none; }
    .back:hover { color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <div class="brand-icon">🐛</div>
      <span class="brand-text">BugTrack</span>
    </div>
    <h1>Choose a new password</h1>
    <p class="hint">Must be at least 6 characters</p>
    <form id="form">
      <div class="field">
        <label for="password">New password</label>
        <div class="input-wrap">
          <input type="password" id="password" name="password" placeholder="New password" minlength="6" required autocomplete="new-password">
          <button type="button" class="toggle-vis" id="t1" aria-label="Show password"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </div>
      <div class="field">
        <label for="confirm">Confirm password</label>
        <div class="input-wrap">
          <input type="password" id="confirm" name="confirm" placeholder="Confirm password" minlength="6" required autocomplete="new-password">
          <button type="button" class="toggle-vis" id="t2" aria-label="Show password"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </div>
      <button type="submit" class="btn" id="btn">Reset Password →</button>
    </form>
    <div id="msg" class="msg"></div>
    <a href="${loginUrl}" class="back">– Back to sign in</a>
  </div>
  <script>
    var form = document.getElementById("form");
    var btn = document.getElementById("btn");
    var msg = document.getElementById("msg");
    var pw = document.getElementById("password");
    var conf = document.getElementById("confirm");
    var actionUrl = ${JSON.stringify(actionUrl)};
    var loginUrl = ${JSON.stringify(loginUrl)};
    var eyeOpen = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    var eyeSlash = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    document.getElementById("t1").onclick = function() {
      pw.type = pw.type === "password" ? "text" : "password";
      this.innerHTML = pw.type === "password" ? eyeOpen : eyeSlash;
      this.setAttribute("aria-label", pw.type === "password" ? "Show password" : "Hide password");
    };
    document.getElementById("t2").onclick = function() {
      conf.type = conf.type === "password" ? "text" : "password";
      this.innerHTML = conf.type === "password" ? eyeOpen : eyeSlash;
      this.setAttribute("aria-label", conf.type === "password" ? "Show password" : "Hide password");
    };
    form.onsubmit = function(e) {
      e.preventDefault();
      var p = pw.value, c = conf.value;
      msg.textContent = "";
      msg.className = "msg";
      if (p.length < 6) { msg.textContent = "Password must be at least 6 characters."; msg.className = "msg err"; return; }
      if (p !== c) { msg.textContent = "Passwords do not match."; msg.className = "msg err"; return; }
      btn.disabled = true;
      fetch(actionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: p })
      })
      .then(function(r) {
        return r.text().then(function(text) {
          var data = {};
          try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }
          return { ok: r.ok, status: r.status, data: data };
        });
      })
      .then(function(r) {
        if (r.ok) {
          msg.textContent = "Password reset successfully. Redirecting to sign in…";
          msg.className = "msg ok";
          setTimeout(function() { window.location.href = loginUrl; }, 2000);
        } else {
          var message = (r.data && r.data.message) || (r.status === 0 ? "Network error. Please check your connection." : "Something went wrong. (" + r.status + ")");
          msg.textContent = message;
          msg.className = "msg err";
          btn.disabled = false;
        }
      })
      .catch(function(err) {
        console.error("Reset password request failed:", err);
        msg.textContent = "Network error. Try again.";
        msg.className = "msg err";
        btn.disabled = false;
      });
    };
  </script>
</body>
</html>
  `);
};

/* ── Reset Password (POST) ─────────────────────────────────── */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Hash the incoming raw token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // must not be expired
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired." });
    }

    // Update password and clear token fields
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now sign in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

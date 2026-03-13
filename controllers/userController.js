/**
 * GET /api/users — List all users (for assignee dropdown, admin, etc.).
 * Returns id, name, email only (no password).
 */
const User = require("../models/User");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email")
      .sort({ name: 1 })
      .lean();
    res.json(users);
  } catch (error) {
    const message =
      process.env.NODE_ENV === "production" ? "Server error" : error.message;
    res.status(500).json({ message });
  }
};

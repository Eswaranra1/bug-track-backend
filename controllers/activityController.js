/**
 * GET /api/activity — Global activity feed (recent activity across all visible bugs).
 */
const bugService = require("../services/bugService");
const BugActivity = require("../models/BugActivity");

exports.getGlobalActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const { bugs } = await bugService.getVisibleBugs(userId, { limit: 500 });
    const bugIds = bugs.map((b) => b._id);
    if (bugIds.length === 0) return res.json({ activities: [] });
    const activities = await BugActivity.find({ bugId: { $in: bugIds } })
      .populate("user", "name email")
      .populate("bugId", "title status")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

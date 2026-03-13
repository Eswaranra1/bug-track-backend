/**
 * GET /api/teams/:id/workspace — Team workspace dashboard data.
 */
const Team = require("../models/Team");
const Bug = require("../models/Bug");
const BugActivity = require("../models/BugActivity");
const { getMemberRole } = require("../middleware/teamMemberMiddleware");

async function ensureMembersPopulated(members, User) {
  if (!members?.length) return members || [];
  const ids = members.map((m) => (m.user?._id ? m.user._id.toString() : m.user?.toString())).filter(Boolean);
  const users = await User.find({ _id: { $in: ids } }).select("name email").lean();
  const byId = {};
  users.forEach((u) => { byId[u._id.toString()] = u; });
  return members.map((m) => {
    const id = m.user?._id ? m.user._id.toString() : m.user?.toString();
    return { user: byId[id] || m.user, role: m.role || "member" };
  });
}

exports.getWorkspace = async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    const User = require("../models/User");

    const team = await Team.findById(teamId)
      .populate("createdBy", "name email")
      .populate("members.user", "name email")
      .lean();
    if (!team) return res.status(404).json({ message: "Team not found" });
    const role = getMemberRole(team, userId);
    if (!role) return res.status(403).json({ message: "Not a team member" });

    const members = await ensureMembersPopulated(
      (team.members || []).map((m) => ({ user: m.user, role: m.role || "member" })),
      User
    );
    const creatorId = team.createdBy?._id?.toString() || team.createdBy?.toString();
    if (creatorId && !members.some((m) => (m.user?._id?.toString() || m.user?.toString()) === creatorId)) {
      members.unshift({ user: team.createdBy, role: "admin" });
    }

    const bugQuery = { teamId };
    const [bugs, bugStats] = await Promise.all([
      Bug.find(bugQuery)
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email")
        .populate("teamId", "name")
        .sort({ updatedAt: -1 })
        .limit(100)
        .lean(),
      Bug.aggregate([
        { $match: bugQuery },
        {
          $facet: {
            byStatus: [
              { $group: { _id: "$status", count: { $sum: 1 } } },
            ],
            total: [{ $count: "n" }],
            resolutionTime: [
              {
                $match: {
                  startDate: { $ne: null },
                  endDate: { $ne: null },
                },
              },
              {
                $project: {
                  hours: {
                    $divide: [
                      { $subtract: ["$endDate", "$startDate"] },
                      1000 * 60 * 60,
                    ],
                  },
                },
              },
              { $group: { _id: null, avgHours: { $avg: "$hours" } } },
            ],
          },
        },
      ]),
    ]);
    const bugIds = bugs.length ? bugs.map((b) => b._id) : [null];
    const recentActivity = await BugActivity.find({
      bugId: { $in: bugIds.filter(Boolean) },
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    const byStatus = {};
    (bugStats[0]?.byStatus || []).forEach((r) => {
      byStatus[r._id || "open"] = r.count;
    });
    const total = bugStats[0]?.total?.[0]?.n ?? 0;
    const avgFixHours =
      bugStats[0]?.resolutionTime?.[0]?.avgHours != null
        ? Math.round(bugStats[0].resolutionTime[0].avgHours * 10) / 10
        : null;

    const openCount = byStatus.open + (byStatus.triaged || 0);
    const inProgressCount =
      (byStatus["in-progress"] || 0) + (byStatus["in-review"] || 0) + (byStatus.testing || 0);
    const doneCount = (byStatus.resolved || 0) + (byStatus.closed || 0);

    res.json({
      team: {
        _id: team._id,
        name: team.name,
        description: team.description,
        createdBy: team.createdBy,
      },
      members,
      bugStats: {
        total,
        open: openCount,
        inProgress: inProgressCount,
        done: doneCount,
        avgFixTimeHours: avgFixHours,
      },
      recentActivity,
      bugs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * Analytics for visible bugs (same visibility as GET /api/bugs).
 */
const Bug = require("../models/Bug");
const Team = require("../models/Team");
const teamRepository = require("../repositories/teamRepository");

exports.getBugAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const scope = req.query.scope;
    const teamIds = await teamRepository.findTeamIdsByUser(userId);
    let match;
    if (scope === "mine") {
      match = { assignedTo: userId };
    } else if (scope === "created") {
      match = { createdBy: userId };
    } else if (scope === "team" && teamIds.length) {
      match = { teamId: { $in: teamIds } };
    } else {
      match = {
        $or: [
          { createdBy: userId },
          { assignedTo: userId },
          ...(teamIds.length ? [{ teamId: { $in: teamIds } }] : []),
        ],
      };
    }

    const [
      byStatusResult,
      byPriorityResult,
      totalResult,
      resolutionResult,
      byTeamResult,
    ] = await Promise.all([
      Bug.aggregate([
        { $match: match },
        { $project: { status: { $toLower: { $ifNull: ["$status", "open"] } } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Bug.aggregate([
        { $match: match },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Bug.countDocuments(match),
      Bug.aggregate([
        {
          $match: {
            ...match,
            startDate: { $ne: null },
            endDate: { $ne: null },
          },
        },
        {
          $project: {
            durationHours: {
              $divide: [
                { $subtract: ["$endDate", "$startDate"] },
                1000 * 60 * 60,
              ],
            },
          },
        },
        { $group: { _id: null, avgHours: { $avg: "$durationHours" } } },
      ]),
      Bug.aggregate([
        { $match: { ...match, teamId: { $ne: null } } },
        {
          $group: {
            _id: "$teamId",
            total: { $sum: 1 },
            resolved: {
              $sum: {
                $cond: [
                  {
                    $in: ["$status", ["resolved", "closed"]],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const byStatus = {};
    byStatusResult.forEach((r) => {
      byStatus[r._id || "open"] = r.count;
    });
    const byPriority = {};
    byPriorityResult.forEach((r) => {
      byPriority[r._id || "medium"] = r.count;
    });
    const resolutionTimeAvgHours =
      resolutionResult[0] && resolutionResult[0].avgHours != null
        ? Math.round(resolutionResult[0].avgHours * 10) / 10
        : null;

    const teamIdsFromAgg = byTeamResult.map((r) => r._id);
    const teams =
      teamIdsFromAgg.length > 0
        ? await Team.find({ _id: { $in: teamIdsFromAgg } })
            .select("name")
            .lean()
        : [];
    const teamNames = Object.fromEntries(teams.map((t) => [t._id.toString(), t.name || "Unlabeled team"]));
    const byTeam = {};
    byTeamResult.forEach((r) => {
      const name = teamNames[r._id.toString()] || "Unlabeled team";
      byTeam[name] = { total: r.total, resolved: r.resolved };
    });

    res.json({
      total: totalResult,
      byStatus,
      byPriority,
      resolutionTimeAvgHours,
      byTeam,
    });
  } catch (error) {
    const message =
      process.env.NODE_ENV === "production" ? "Server error" : error.message;
    res.status(500).json({ message });
  }
};

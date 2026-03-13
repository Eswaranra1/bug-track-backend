const Team = require("../models/Team");
const User = require("../models/User");
const { getMemberRole } = require("../middleware/teamMemberMiddleware");

exports.createTeam = async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;
    const creatorId = req.user.id;
    const membersList = [{ user: creatorId, role: "admin" }];
    for (const m of members) {
      let uid = m.userId;
      if (m.email && !uid) {
        const u = await User.findOne({ email: m.email.trim().toLowerCase() }).select("_id");
        if (u) uid = u._id.toString();
      }
      if (uid && uid !== creatorId) membersList.push({ user: uid, role: m.role || "member" });
    }
    const deduped = [];
    const seen = new Set();
    for (const m of membersList) {
      const id = m.user.toString();
      if (seen.has(id)) continue;
      seen.add(id);
      deduped.push(m);
    }
    const team = await Team.create({
      name,
      description: description || "",
      createdBy: creatorId,
      members: deduped,
    });
    const populated = await Team.findById(team._id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email")
      .lean();
    res.status(201).json(populated);
  } catch (error) {
    if (error.name === "CastError")
      return res.status(400).json({ message: "Invalid user ID in members" });
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const userId = req.user.id;
    const teams = await Team.find({
      $or: [{ createdBy: userId }, { "members.user": userId }],
    })
      .populate("createdBy", "name email")
      .populate("members.user", "name email")
      .sort({ createdAt: -1 })
      .lean();
    for (const t of teams) {
      t.members = normalizeMembers(t.members);
      t.members = await ensureMembersPopulated(t.members);
    }
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

function normalizeMembers(members) {
  if (!Array.isArray(members)) return [];
  return members.map((m) => {
    if (m && m.user) return { user: m.user, role: m.role || "member" };
    if (m) return { user: m, role: "member" };
    return null;
  }).filter(Boolean);
}

async function ensureMembersPopulated(members) {
  if (!members.length) return members;
  const ids = members.map((m) => {
    const u = m.user;
    return u && (u._id ? u._id.toString() : u.toString());
  }).filter(Boolean);
  const needFetch = members.some((m) => !m.user || typeof m.user !== "object" || !m.user.name);
  if (!needFetch) return members;
  const users = await User.find({ _id: { $in: ids } }).select("name email").lean();
  const byId = {};
  users.forEach((u) => { byId[u._id.toString()] = u; });
  return members.map((m) => {
    const id = m.user && (m.user._id ? m.user._id.toString() : m.user.toString());
    return { user: byId[id] || m.user, role: m.role || "member" };
  });
}

exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email")
      .lean();
    if (!team) return res.status(404).json({ message: "Team not found" });
    const role = getMemberRole(team, req.user.id);
    if (!role) return res.status(403).json({ message: "Not a team member" });
    team.members = normalizeMembers(team.members);
    team.members = await ensureMembersPopulated(team.members);
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("members.user", "name email")
      .lean();
    if (!team) return res.status(404).json({ message: "Team not found" });
    const role = getMemberRole(team, req.user.id);
    if (!role || !["admin", "manager"].includes(role))
      return res.status(403).json({ message: "Only admin or manager can update team" });
    const { name, description } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    await Team.findByIdAndUpdate(req.params.id, update);
    const updated = await Team.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email")
      .lean();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).lean();
    if (!team) return res.status(404).json({ message: "Team not found" });
    const role = getMemberRole(team, req.user.id);
    if (role !== "admin")
      return res.status(403).json({ message: "Only team admin can delete the team" });
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: "Team deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/** GET /api/teams/:id/members — list members with roles (for assignee picker & team page) */
exports.getTeamMembers = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("members.user", "name email")
      .populate("createdBy", "name email")
      .lean();
    if (!team) return res.status(404).json({ message: "Team not found" });
    const role = getMemberRole(team, req.user.id);
    if (!role) return res.status(403).json({ message: "Not a team member" });
    let members = normalizeMembers(team.members);
    members = await ensureMembersPopulated(members);
    const creatorId = team.createdBy && (team.createdBy._id ? team.createdBy._id.toString() : team.createdBy.toString());
    if (creatorId && !members.some((m) => (m.user._id ? m.user._id.toString() : m.user.toString()) === creatorId)) {
      members = [{ user: team.createdBy, role: "admin" }, ...members];
    }
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/** POST /api/teams/:id/members — add or update member. Body: { userId, role } or { email, role }. Admin/manager only. */
exports.addOrUpdateMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    const role = getMemberRole(team, req.user.id);
    if (!role || !["admin", "manager"].includes(role))
      return res.status(403).json({ message: "Only admin or manager can add or change members" });
    let userId = req.body.userId;
    const newRole = req.body.role;
    if (!newRole) return res.status(400).json({ message: "role required" });
    if (req.body.email && !userId) {
      const user = await User.findOne({ email: req.body.email.trim().toLowerCase() }).select("_id");
      if (!user) return res.status(404).json({ message: "User not found with this email" });
      userId = user._id.toString();
    }
    if (!userId) return res.status(400).json({ message: "userId or email required" });
    const creatorStr = team.createdBy.toString();
    if (userId === creatorStr) return res.status(400).json({ message: "Cannot change creator role" });
    const existing = team.members.find((m) => m.user.toString() === userId);
    if (existing) {
      existing.role = newRole;
    } else {
      team.members.push({ user: userId, role: newRole });
    }
    await team.save();
    const populated = await Team.findById(team._id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email")
      .lean();
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/** DELETE /api/teams/:id/members/:userId — remove member. Admin/manager only. */
exports.removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    const role = getMemberRole(team, req.user.id);
    if (!role || !["admin", "manager"].includes(role))
      return res.status(403).json({ message: "Only admin or manager can remove members" });
    const { userId } = req.params;
    if (team.createdBy.toString() === userId)
      return res.status(400).json({ message: "Cannot remove team creator" });
    team.members = team.members.filter((m) => m.user.toString() !== userId);
    await team.save();
    const populated = await Team.findById(team._id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email")
      .lean();
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

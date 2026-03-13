const Team = require("../models/Team");
const { ROLES } = require("../models/Team");

/** Get current user's role in team. Creator is treated as admin. Supports old schema (members as ObjectIds). */
function getMemberRole(team, userId) {
  if (team.createdBy && (team.createdBy._id ? team.createdBy._id.toString() : team.createdBy.toString()) === userId) return "admin";
  if (!team.members || !Array.isArray(team.members)) return null;
  const member = team.members.find((m) => {
    if (!m) return false;
    const uid = m.user ? (m.user._id ? m.user._id.toString() : m.user.toString()) : m.toString();
    return uid === userId;
  });
  return member ? (member.role || "member") : null;
}

/** Require user to be in the team (any role). Sets req.team and req.teamRole. */
async function requireTeamMember(req, res, next) {
  const teamId = req.params.teamId || req.params.id || req.body.teamId;
  if (!teamId) return res.status(400).json({ message: "Team ID required" });
  try {
    const team = await Team.findById(teamId).populate("members.user", "name email").lean();
    if (!team) return res.status(404).json({ message: "Team not found" });
    const role = getMemberRole(team, req.user.id);
    if (!role) return res.status(403).json({ message: "Not a team member" });
    req.team = team;
    req.teamRole = role;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

/** Require one of the given roles (e.g. ['admin', 'manager']). Use after requireTeamMember. */
function requireTeamRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.teamRole || !allowedRoles.includes(req.teamRole)) {
      return res.status(403).json({ message: "Insufficient role in this team" });
    }
    next();
  };
}

/** Optional: attach team and role to req if teamId provided and user is member. */
async function optionalTeamMember(req, res, next) {
  const teamId = req.params.teamId || req.params.id || req.body.teamId;
  if (!teamId) return next();
  try {
    const team = await Team.findById(teamId).populate("members.user", "name email").lean();
    if (!team) return next();
    const role = getMemberRole(team, req.user.id);
    if (role) {
      req.team = team;
      req.teamRole = role;
    }
    next();
  } catch (err) {
    next();
  }
}

module.exports = {
  requireTeamMember,
  requireTeamRole,
  optionalTeamMember,
  getMemberRole,
  ROLES,
};

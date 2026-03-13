/**
 * Team repository — database access only.
 * No business logic, no HTTP.
 */
const Team = require("../models/Team");

exports.findTeamIdsByUser = async (userId) => {
  const teams = await Team.find({
    $or: [{ createdBy: userId }, { "members.user": userId }],
  }).select("_id").lean();
  return teams.map((t) => t._id);
};

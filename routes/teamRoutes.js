const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { validateObjectId } = require("../middleware/validateParamId");
const { requireTeamMember, requireTeamRole } = require("../middleware/teamMemberMiddleware");
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addOrUpdateMember,
  removeMember,
} = require("../controllers/teamController");
const { getWorkspace } = require("../controllers/workspaceController");
const {
  validate,
  teamCreateSchema,
  teamUpdateSchema,
  teamMemberSchema,
} = require("../middleware/validateMiddleware");

// List and create (no :id)
router.post("/", auth, validate(teamCreateSchema), createTeam);
router.get("/", auth, getTeams);

// Validate :id for all routes below
router.use("/:id", validateObjectId("id"));

router.get("/:id/workspace", auth, requireTeamMember, getWorkspace);

// Nested /:id/members before generic /:id (so "members" is not captured as id)
router.get("/:id/members", auth, getTeamMembers);
router.post("/:id/members", auth, requireTeamMember, requireTeamRole(["admin", "manager"]), validate(teamMemberSchema, "body"), addOrUpdateMember);
router.delete("/:id/members/:userId", auth, validateObjectId("userId"), requireTeamMember, requireTeamRole(["admin", "manager"]), removeMember);

// Single team by id
router.get("/:id", auth, getTeamById);
router.put("/:id", auth, validate(teamUpdateSchema), updateTeam);
router.delete("/:id", auth, deleteTeam);

module.exports = router;

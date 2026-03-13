const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { validateObjectId } = require("../middleware/validateParamId");
const { deleteComment, toggleReaction } = require("../controllers/commentController");
const { validate, reactionSchema } = require("../middleware/validateMiddleware");

router.use("/:id", validateObjectId("id"));
router.delete("/:id", auth, deleteComment);
router.post("/:id/reactions", auth, validate(reactionSchema, "body"), toggleReaction);

module.exports = router;

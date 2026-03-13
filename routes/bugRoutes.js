const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { validateObjectId } = require("../middleware/validateParamId");
const {
  createBug,
  getBugs,
  getBugById,
  updateBug,
  deleteBug,
  getBugActivity,
  startWork,
  stopWork,
} = require("../controllers/bugController");
const { addComment, getComments } = require("../controllers/commentController");
const { uploadAttachment, getAttachments } = require("../controllers/attachmentController");
const { validate, bugCreateSchema, bugUpdateSchema, commentSchema } = require("../middleware/validateMiddleware");
const upload = require("../config/multer");

// List and create (no :id)
router.post("/", auth, validate(bugCreateSchema), createBug);
router.get("/", auth, getBugs);

// Validate :id for all routes below (invalid ObjectId → 400)
router.use("/:id", validateObjectId("id"));

// Nested resources first (more specific than /:id to avoid matching "123/activity" as id)
router.get("/:id/activity", auth, getBugActivity);
router.patch("/:id/start", auth, startWork);
router.patch("/:id/stop", auth, stopWork);
router.post("/:id/comments", auth, validate(commentSchema, "body"), addComment);
router.get("/:id/comments", auth, getComments);
router.post("/:id/attachments", auth, upload.single("file"), uploadAttachment);
router.get("/:id/attachments", auth, getAttachments);

// Single bug by id (must be last among :id routes)
router.get("/:id", auth, getBugById);
router.put("/:id", auth, validate(bugUpdateSchema), updateBug);
router.delete("/:id", auth, deleteBug);

module.exports = router;

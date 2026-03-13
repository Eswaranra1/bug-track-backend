const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { validateObjectId } = require("../middleware/validateParamId");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

// Static path before :id so "read-all" is not matched as id
router.get("/", auth, getNotifications);
router.put("/read-all", auth, markAllAsRead);
router.put("/:id/read", auth, validateObjectId("id"), markAsRead);

module.exports = router;

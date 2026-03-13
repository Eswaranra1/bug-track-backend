const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getGlobalActivity } = require("../controllers/activityController");

router.get("/", auth, getGlobalActivity);

module.exports = router;

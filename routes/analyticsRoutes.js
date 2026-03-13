const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getBugAnalytics } = require("../controllers/analyticsController");

router.get("/bugs", auth, getBugAnalytics);

module.exports = router;

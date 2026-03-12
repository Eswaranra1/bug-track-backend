const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createBug,
  getBugs,
  updateBug,
  deleteBug,
} = require("../controllers/bugController");

router.post("/", auth, createBug);
router.get("/", auth, getBugs);
router.put("/:id", auth, updateBug);
router.delete("/:id", auth, deleteBug);

module.exports = router;

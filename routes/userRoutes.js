const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getUsers } = require("../controllers/userController");

router.get("/", auth, getUsers);

module.exports = router;

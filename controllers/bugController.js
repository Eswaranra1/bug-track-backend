const Bug = require("../models/Bug");

exports.createBug = async (req, res) => {
  try {
    const bug = new Bug({
      ...req.body,
      createdBy: req.user.id,
    });

    await bug.save();

    res.json(bug);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBugs = async (req, res) => {
  try {
    const bugs = await Bug.find({ createdBy: req.user.id }).sort({ createdAt: -1 });

    res.json(bugs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBug = async (req, res) => {
  try {
    // Ensure the bug belongs to the user
    const bug = await Bug.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!bug) {
      return res.status(404).json({ message: "Bug not found or unauthorized" });
    }

    res.json(bug);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBug = async (req, res) => {
  try {
    const bug = await Bug.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });

    if (!bug) {
      return res.status(404).json({ message: "Bug not found or unauthorized" });
    }

    res.json({ message: "Bug deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
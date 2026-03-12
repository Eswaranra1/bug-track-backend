const Bug = require("../models/Bug");

exports.createBug = async (req, res) => {
  try {
    const bug = new Bug({
      ...req.body,
      createdBy: req.user.id,
    });

    await bug.save();

    res.status(201).json({ success: true, data: bug });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBugs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Bug.countDocuments({ createdBy: req.user.id });

    const bugs = await Bug.find({ createdBy: req.user.id })
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bugs.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1
      },
      data: bugs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
      return res.status(404).json({ success: false, error: "Bug not found or unauthorized" });
    }

    res.json({ success: true, data: bug });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteBug = async (req, res) => {
  try {
    const bug = await Bug.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });

    if (!bug) {
      return res.status(404).json({ success: false, error: "Bug not found or unauthorized" });
    }

    res.json({ success: true, message: "Bug deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
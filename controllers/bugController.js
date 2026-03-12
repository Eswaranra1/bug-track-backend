const Bug = require("../models/Bug");

exports.createBug = async (req, res) => {
  const bug = new Bug({
    ...req.body,
    createdBy: req.user.id,
  });

  await bug.save();

  res.json(bug);
};

exports.getBugs = async (req, res) => {
  const bugs = await Bug.find({ createdBy: req.user.id });

  res.json(bugs);
};

exports.updateBug = async (req, res) => {
  const bug = await Bug.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.json(bug);
};

exports.deleteBug = async (req, res) => {
  await Bug.findByIdAndDelete(req.params.id);

  res.json({ message: "Bug deleted" });
};
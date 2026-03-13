const Attachment = require("../models/Attachment");
const Bug = require("../models/Bug");
const Team = require("../models/Team");
const path = require("path");
const fs = require("fs");
const { createBugActivity, ACTION } = require("../helpers/bugActivityHelper");

async function canAccessBug(userId, bugId) {
  const bug = await Bug.findById(bugId).select("createdBy assignedTo teamId").lean();
  if (!bug) return false;
  if (bug.createdBy.toString() === userId) return true;
  if (bug.assignedTo && bug.assignedTo.toString() === userId) return true;
  if (!bug.teamId) return false;
  const team = await Team.findById(bug.teamId).select("members createdBy").lean();
  if (!team) return false;
  return (
    team.createdBy.toString() === userId ||
    team.members.some((m) => (m.user ? m.user.toString() : m.toString()) === userId)
  );
}

exports.uploadAttachment = async (req, res) => {
  try {
    const bugId = req.params.id;
    const allowed = await canAccessBug(req.user.id, bugId);
    if (!allowed) return res.status(403).json({ message: "Access denied" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const fileUrl = "/uploads/" + req.file.filename;
    const attachment = await Attachment.create({
      bugId,
      uploadedBy: req.user.id,
      fileUrl,
      originalName: req.file.originalname,
    });
    await createBugActivity(bugId, ACTION.ATTACHMENT_ADDED, req.user.id, {
      attachmentId: attachment._id,
      fileName: req.file.originalname,
    });
    const populated = await Attachment.findById(attachment._id)
      .populate("uploadedBy", "name email")
      .lean();
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.getAttachments = async (req, res) => {
  try {
    const bugId = req.params.id;
    const allowed = await canAccessBug(req.user.id, bugId);
    if (!allowed) return res.status(403).json({ message: "Access denied" });
    const attachments = await Attachment.find({ bugId })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(attachments);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

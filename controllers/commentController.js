const Comment = require("../models/Comment");
const Bug = require("../models/Bug");
const Team = require("../models/Team");
const User = require("../models/User");
const { createBugActivity, ACTION } = require("../helpers/bugActivityHelper");
const { createNotification } = require("../helpers/notificationHelper");
const { sendCommentAlertEmail, sendMentionEmail } = require("../helpers/emailAlertHelper");

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

exports.addComment = async (req, res) => {
  try {
    const bugId = req.params.id;
    const allowed = await canAccessBug(req.user.id, bugId);
    if (!allowed) return res.status(403).json({ message: "Access denied" });
    const bug = await Bug.findById(bugId).select("title assignedTo").lean();
    if (!bug) return res.status(404).json({ message: "Bug not found" });
    const { message, parentId, mentionedUserIds = [] } = req.body;
    const comment = await Comment.create({
      bugId,
      user: req.user.id,
      message,
      parentId: parentId || undefined,
      reactions: [],
    });
    await createBugActivity(bugId, ACTION.COMMENT_ADDED, req.user.id, {
      commentId: comment._id,
    });
    const commenter = await User.findById(req.user.id).select("name").lean();
    const commenterName = commenter?.name || "Someone";
    const preview = message.slice(0, 100) + (message.length > 100 ? "…" : "");
    if (bug.assignedTo && bug.assignedTo.toString() !== req.user.id) {
      await createNotification(
        bug.assignedTo,
        `New comment on "${bug.title}"`,
        "BUG_COMMENT",
        bugId
      );
      await sendCommentAlertEmail(bug.assignedTo, bug.title, preview, bugId);
    }
    const mentioned = [...new Set(mentionedUserIds)].filter(
      (id) => id && id !== req.user.id
    );
    for (const uid of mentioned) {
      await createNotification(
        uid,
        `${commenterName} mentioned you on "${bug.title}"`,
        "COMMENT_MENTION",
        bugId
      );
      await sendMentionEmail(uid, bug.title, commenterName, preview, bugId);
    }
    const populated = await Comment.findById(comment._id)
      .populate("user", "name email")
      .lean();
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.getComments = async (req, res) => {
  try {
    const bugId = req.params.id;
    const allowed = await canAccessBug(req.user.id, bugId);
    if (!allowed) return res.status(403).json({ message: "Access denied" });
    const comments = await Comment.find({ bugId })
      .populate("user", "name email")
      .populate("reactions.userId", "name")
      .sort({ createdAt: 1 })
      .lean();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Can only delete your own comment" });
    const allowed = await canAccessBug(req.user.id, comment.bugId.toString());
    if (!allowed) return res.status(403).json({ message: "Access denied" });
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/** POST /api/comments/:id/reactions — toggle reaction (add or remove) for current user. Body: { emoji } */
exports.toggleReaction = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    const allowed = await canAccessBug(req.user.id, comment.bugId.toString());
    if (!allowed) return res.status(403).json({ message: "Access denied" });
    const { emoji } = req.body;
    if (!emoji || typeof emoji !== "string") return res.status(400).json({ message: "emoji required" });
    const e = emoji.trim().slice(0, 20);
    comment.reactions = comment.reactions || [];
    const idx = comment.reactions.findIndex(
      (r) => r.userId.toString() === req.user.id && r.emoji === e
    );
    if (idx >= 0) {
      comment.reactions.splice(idx, 1);
    } else {
      comment.reactions.push({ userId: req.user.id, emoji: e });
    }
    await comment.save();
    const populated = await Comment.findById(comment._id)
      .populate("user", "name email")
      .populate("reactions.userId", "name")
      .lean();
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

const mongoose = require("mongoose");

const ACTION_ENUM = [
  "CREATED",
  "ASSIGNED",
  "STATUS_CHANGED",
  "PRIORITY_CHANGED",
  "COMMENT_ADDED",
  "ATTACHMENT_ADDED",
  "TIME_UPDATED",
  "CLOSED",
];

const bugActivitySchema = new mongoose.Schema(
  {
    bugId: { type: mongoose.Schema.Types.ObjectId, ref: "Bug", required: true },
    action: { type: String, enum: ACTION_ENUM, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }, // e.g. { from, to, assigneeId, etc. }
  },
  { timestamps: true }
);

bugActivitySchema.index({ bugId: 1, createdAt: 1 });

module.exports = mongoose.model("BugActivity", bugActivitySchema);
module.exports.ACTION_ENUM = ACTION_ENUM;

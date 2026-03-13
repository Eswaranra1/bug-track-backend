const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    bugId: { type: mongoose.Schema.Types.ObjectId, ref: "Bug", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        emoji: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);
commentSchema.index({ bugId: 1, createdAt: 1 });
commentSchema.index({ parentId: 1 });

module.exports = mongoose.model("Comment", commentSchema);

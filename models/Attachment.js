const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    bugId: { type: mongoose.Schema.Types.ObjectId, ref: "Bug", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true },
    originalName: { type: String },
  },
  { timestamps: true }
);

attachmentSchema.index({ bugId: 1 });

module.exports = mongoose.model("Attachment", attachmentSchema);

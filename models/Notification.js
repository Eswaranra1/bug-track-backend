const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    type: { type: String }, // e.g. ASSIGNED, COMMENT, STATUS_CHANGED, RESOLVED
    read: { type: Boolean, default: false },
    bugId: { type: mongoose.Schema.Types.ObjectId, ref: "Bug" },
    link: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);

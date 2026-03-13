const mongoose = require("mongoose");

const bugSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "triaged", "in-progress", "in-review", "testing", "resolved", "closed"],
      default: "open",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    estimatedTime: { type: Number }, // hours
    actualTime: { type: Number },    // hours
    startDate: { type: Date },
    endDate: { type: Date },
    workLogs: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        start: { type: Date, required: true },
        end: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

bugSchema.index({ createdBy: 1 });
bugSchema.index({ assignedTo: 1 });
bugSchema.index({ teamId: 1 });
bugSchema.index({ status: 1 });
bugSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Bug", bugSchema);

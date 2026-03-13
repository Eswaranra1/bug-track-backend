const mongoose = require("mongoose");

const ROLES = ["admin", "manager", "developer", "qa", "member"];

const teamMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ROLES,
      default: "member",
    },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [teamMemberSchema],
  },
  { timestamps: true }
);

teamSchema.index({ "members.user": 1 });
teamSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Team", teamSchema);
module.exports.ROLES = ROLES;

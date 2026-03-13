const BugActivity = require("../models/BugActivity");

const ACTION = {
  CREATED: "CREATED",
  ASSIGNED: "ASSIGNED",
  STATUS_CHANGED: "STATUS_CHANGED",
  PRIORITY_CHANGED: "PRIORITY_CHANGED",
  COMMENT_ADDED: "COMMENT_ADDED",
  ATTACHMENT_ADDED: "ATTACHMENT_ADDED",
  TIME_UPDATED: "TIME_UPDATED",
  CLOSED: "CLOSED",
  DELETED: "DELETED",
};

async function createBugActivity(bugId, action, userId, metadata = {}) {
  await BugActivity.create({ bugId, action, user: userId, metadata });
}

module.exports = { createBugActivity, ACTION };

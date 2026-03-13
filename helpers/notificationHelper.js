const Notification = require("../models/Notification");

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

async function createNotification(userId, message, type, bugId = null) {
  const link = bugId ? `${clientUrl}/bugs/${bugId}` : null;
  await Notification.create({ userId, message, type, bugId, link });
}

module.exports = { createNotification };

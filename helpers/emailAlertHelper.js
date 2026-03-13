const User = require("../models/User");
const { sendEmail } = require("./resendHelper");

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

async function getEmailForUser(userId) {
  const user = await User.findById(userId).select("email name").lean();
  return user ? user.email : null;
}

async function sendAssignedEmail(assigneeId, bugTitle, bugPriority, bugId) {
  const email = await getEmailForUser(assigneeId);
  if (!email) return;
  const url = `${clientUrl}/bugs/${bugId}`;
  await sendEmail({
    to: email,
    subject: `[BugTrack] You were assigned to: ${bugTitle}`,
    html: `<p>You have been assigned to a bug.</p><p><strong>${bugTitle}</strong></p><p>Priority: ${bugPriority}</p><p><a href="${url}">View bug</a></p>`,
  }).catch((err) => console.error("Assigned email failed:", err.message));
}

async function sendResolvedEmail(userId, bugTitle, bugId) {
  const email = await getEmailForUser(userId);
  if (!email) return;
  const url = `${clientUrl}/bugs/${bugId}`;
  await sendEmail({
    to: email,
    subject: `[BugTrack] Bug resolved: ${bugTitle}`,
    html: `<p>A bug you're involved with has been resolved.</p><p><strong>${bugTitle}</strong></p><p><a href="${url}">View bug</a></p>`,
  }).catch((err) => console.error("Resolved email failed:", err.message));
}

async function sendCommentAlertEmail(userId, bugTitle, commentPreview, bugId) {
  const email = await getEmailForUser(userId);
  if (!email) return;
  const url = `${clientUrl}/bugs/${bugId}`;
  await sendEmail({
    to: email,
    subject: `[BugTrack] New comment on: ${bugTitle}`,
    html: `<p>New comment on a bug assigned to you.</p><p><strong>${bugTitle}</strong></p><p>${commentPreview}</p><p><a href="${url}">View bug</a></p>`,
  }).catch((err) => console.error("Comment alert email failed:", err.message));
}

async function sendMentionEmail(userId, bugTitle, commenterName, commentPreview, bugId) {
  const email = await getEmailForUser(userId);
  if (!email) return;
  const url = `${clientUrl}/bugs/${bugId}`;
  await sendEmail({
    to: email,
    subject: `[BugTrack] ${commenterName} mentioned you on: ${bugTitle}`,
    html: `<p><strong>${commenterName}</strong> mentioned you in a comment.</p><p><strong>${bugTitle}</strong></p><p>${commentPreview}</p><p><a href="${url}">View bug</a></p>`,
  }).catch((err) => console.error("Mention email failed:", err.message));
}

module.exports = {
  sendAssignedEmail,
  sendResolvedEmail,
  sendCommentAlertEmail,
  sendMentionEmail,
  getEmailForUser,
};

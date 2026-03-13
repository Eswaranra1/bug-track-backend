/**
 * Bug service — business logic for bugs.
 * Uses repositories for DB access; triggers activity, notifications, emails via helpers.
 * No HTTP (req/res); returns data or throws.
 */
const bugRepository = require("../repositories/bugRepository");
const teamRepository = require("../repositories/teamRepository");
const { createBugActivity, ACTION } = require("../helpers/bugActivityHelper");
const { createNotification } = require("../helpers/notificationHelper");
const { sendAssignedEmail, sendResolvedEmail } = require("../helpers/emailAlertHelper");

const ALLOWED_UPDATE_FIELDS = [
  "title", "description", "priority", "status", "assignedTo",
  "estimatedTime", "actualTime", "startDate", "endDate",
];

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => { if (obj[k] !== undefined) out[k] = obj[k]; });
  return out;
}

exports.getVisibleBugs = async (userId, filters = {}) => {
  const teamIds = await teamRepository.findTeamIdsByUser(userId);
  const query = {
    $or: [
      { createdBy: userId },
      { assignedTo: userId },
      ...(teamIds.length ? [{ teamId: { $in: teamIds } }] : []),
    ],
  };
  const { scope, teamId, assignedTo, priority, status, sort = "createdAt", order = "desc", page = 1, limit = 50 } = filters;
  if (scope === "mine") query.assignedTo = userId;
  else if (scope === "created") query.createdBy = userId;
  else if (scope === "team" && teamIds.length) query.teamId = { $in: teamIds };
  if (teamId) query.teamId = teamId;
  if (assignedTo) query.assignedTo = assignedTo;
  if (priority) query.priority = priority;
  if (status) query.status = status;
  const sortObj = { [sort]: order === "asc" ? 1 : -1 };
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [bugs, total] = await Promise.all([
    bugRepository.findWithFilters(query, sortObj, skip, limitNum),
    bugRepository.count(query),
  ]);
  return {
    bugs,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
};

exports.getBugByIdIfAllowed = async (bugId, userId) => {
  const bug = await bugRepository.findById(bugId);
  if (!bug) return null;
  const teamIds = await teamRepository.findTeamIdsByUser(userId);
  const createdByMatch = bug.createdBy && (bug.createdBy._id?.toString() || bug.createdBy.toString()) === userId;
  const assignedMatch = bug.assignedTo && (bug.assignedTo._id?.toString() || bug.assignedTo.toString()) === userId;
  const teamMatch = bug.teamId && teamIds.some((id) => id.toString() === (bug.teamId._id?.toString() || bug.teamId.toString()));
  if (!createdByMatch && !assignedMatch && !teamMatch) return null;
  return bug;
};

exports.createBug = async (userId, body) => {
  const teamIds = await teamRepository.findTeamIdsByUser(userId);
  const data = pick(body, [...ALLOWED_UPDATE_FIELDS, "teamId"]);
  data.createdBy = userId;
  if (data.teamId && !teamIds.some((id) => id.toString() === data.teamId.toString())) {
    const err = new Error("Not a member of this team");
    err.statusCode = 403;
    throw err;
  }
  const bug = await bugRepository.create(data);
  await createBugActivity(bug._id, ACTION.CREATED, userId, { title: bug.title, priority: bug.priority });
  if (bug.assignedTo && bug.assignedTo.toString() !== userId) {
    await createNotification(bug.assignedTo, `You were assigned to bug: ${bug.title}`, "ASSIGNED", bug._id);
    await sendAssignedEmail(bug.assignedTo, bug.title, bug.priority, bug._id);
  }
  return await bugRepository.findById(bug._id);
};

exports.updateBug = async (bugId, userId, body) => {
  const Bug = require("../models/Bug");
  const bug = await Bug.findById(bugId);
  if (!bug) return null;
  const teamIds = await teamRepository.findTeamIdsByUser(userId);
  const canEdit =
    bug.createdBy.toString() === userId ||
    (bug.assignedTo && bug.assignedTo.toString() === userId) ||
    (bug.teamId && teamIds.some((id) => id.toString() === bug.teamId.toString()));
  if (!canEdit) {
    const err = new Error("Not authorized to edit");
    err.statusCode = 403;
    throw err;
  }
  const updates = pick(body, ALLOWED_UPDATE_FIELDS);
  const prevAssigned = bug.assignedTo ? bug.assignedTo.toString() : null;
  const prevStatus = bug.status;

  if (updates.assignedTo !== undefined && updates.assignedTo !== prevAssigned) {
    await createBugActivity(bug._id, ACTION.ASSIGNED, userId, { assigneeId: updates.assignedTo, previous: prevAssigned });
    if (updates.assignedTo) {
      await createNotification(updates.assignedTo, `You were assigned to bug: ${bug.title}`, "ASSIGNED", bug._id);
      await sendAssignedEmail(updates.assignedTo, bug.title, updates.priority || bug.priority, bug._id);
    }
  }
  if (updates.status !== undefined && updates.status !== prevStatus) {
    await createBugActivity(bug._id, ACTION.STATUS_CHANGED, userId, { from: prevStatus, to: updates.status });
    if (updates.status === "in-progress" && !bug.startDate) updates.startDate = new Date();
    if ((updates.status === "resolved" || updates.status === "closed") && !bug.endDate) updates.endDate = new Date();
    if (updates.status === "resolved" || updates.status === "closed") {
      if (bug.assignedTo) await sendResolvedEmail(bug.assignedTo, bug.title, bug._id);
      await createNotification(bug.createdBy.toString(), `Bug "${bug.title}" was ${updates.status}`, "RESOLVED", bug._id);
    }
    if (updates.status === "closed") await createBugActivity(bug._id, ACTION.CLOSED, userId, {});
  }
  if (updates.priority !== undefined && updates.priority !== bug.priority) {
    await createBugActivity(bug._id, ACTION.PRIORITY_CHANGED, userId, {
      from: bug.priority,
      to: updates.priority,
    });
  }
  if (updates.estimatedTime !== undefined || updates.actualTime !== undefined || updates.startDate !== undefined || updates.endDate !== undefined) {
    await createBugActivity(bug._id, ACTION.TIME_UPDATED, userId, {
      estimatedTime: updates.estimatedTime ?? bug.estimatedTime,
      actualTime: updates.actualTime ?? bug.actualTime,
      startDate: updates.startDate ?? bug.startDate,
      endDate: updates.endDate ?? bug.endDate,
    });
  }
  Object.assign(bug, updates);
  await bug.save();
  return await bugRepository.findById(bugId);
};

exports.deleteBugIfAllowed = async (bugId, userId) => {
  const Bug = require("../models/Bug");
  const bug = await Bug.findById(bugId);
  if (!bug) return false;
  const teamIds = await teamRepository.findTeamIdsByUser(userId);
  const canDelete =
    bug.createdBy.toString() === userId ||
    (bug.teamId && teamIds.some((id) => id.toString() === bug.teamId.toString()));
  if (!canDelete) {
    const err = new Error("Not authorized to delete");
    err.statusCode = 403;
    throw err;
  }
  await bugRepository.deleteById(bugId);
  return true;
};

/** Returns activities for a bug if the user can access it; otherwise null. Filters: user, action, search. */
exports.getBugActivityIfAllowed = async (bugId, userId, filters = {}) => {
  const bug = await bugRepository.findByIdLean(bugId, "createdBy assignedTo teamId");
  if (!bug) return null;
  const teamIds = await teamRepository.findTeamIdsByUser(userId);
  const createdByMatch = (bug.createdBy && bug.createdBy.toString()) === userId;
  const assignedMatch = bug.assignedTo && bug.assignedTo.toString() === userId;
  const teamMatch = bug.teamId && teamIds.some((id) => id.toString() === bug.teamId.toString());
  if (!createdByMatch && !assignedMatch && !teamMatch) return null;
  const BugActivity = require("../models/BugActivity");
  const query = { bugId };
  if (filters.user) query.user = filters.user;
  if (filters.action) query.action = filters.action;
  let activities = await BugActivity.find(query)
    .populate("user", "name email")
    .sort({ createdAt: 1 })
    .lean();
  if (filters.search && typeof filters.search === "string" && filters.search.trim()) {
    const s = filters.search.trim().toLowerCase();
    activities = activities.filter(
      (a) =>
        (a.action && a.action.toLowerCase().includes(s)) ||
        (a.metadata && JSON.stringify(a.metadata).toLowerCase().includes(s))
    );
  }
  return activities;
};

/** Start work on a bug: add workLog with start, no end. Returns updated bug or throws. */
exports.startWork = async (bugId, userId) => {
  const Bug = require("../models/Bug");
  const bug = await Bug.findById(bugId);
  if (!bug) return null;
  const teamIds = await teamRepository.findTeamIdsByUser(userId);
  const canEdit =
    bug.createdBy.toString() === userId ||
    (bug.assignedTo && bug.assignedTo.toString() === userId) ||
    (bug.teamId && teamIds.some((id) => id.toString() === bug.teamId.toString()));
  if (!canEdit) {
    const err = new Error("Not authorized");
    err.statusCode = 403;
    throw err;
  }
  const openLog = (bug.workLogs || []).find(
    (l) => l.userId.toString() === userId && !l.end
  );
  if (openLog) {
    const err = new Error("You already have an active work session on this bug");
    err.statusCode = 400;
    throw err;
  }
  bug.workLogs = bug.workLogs || [];
  bug.workLogs.push({ userId, start: new Date() });
  await bug.save();
  return await bugRepository.findById(bugId);
};

/** Stop work: set end on latest open workLog for this user; recompute actualTime. */
exports.stopWork = async (bugId, userId) => {
  const Bug = require("../models/Bug");
  const bug = await Bug.findById(bugId);
  if (!bug) return null;
  const teamIds = await teamRepository.findTeamIdsByUser(userId);
  const canEdit =
    bug.createdBy.toString() === userId ||
    (bug.assignedTo && bug.assignedTo.toString() === userId) ||
    (bug.teamId && teamIds.some((id) => id.toString() === bug.teamId.toString()));
  if (!canEdit) {
    const err = new Error("Not authorized");
    err.statusCode = 403;
    throw err;
  }
  const logs = bug.workLogs || [];
  const openIndex = logs.findIndex(
    (l) => l.userId.toString() === userId && !l.end
  );
  if (openIndex === -1) {
    const err = new Error("No active work session to stop");
    err.statusCode = 400;
    throw err;
  }
  logs[openIndex].end = new Date();
  let totalMs = 0;
  logs.forEach((l) => {
    if (l.start && l.end) totalMs += new Date(l.end) - new Date(l.start);
  });
  bug.actualTime = Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
  bug.workLogs = logs;
  await bug.save();
  return await bugRepository.findById(bugId);
};
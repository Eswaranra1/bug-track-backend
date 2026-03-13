const bugService = require("../services/bugService");

const ALLOWED_UPDATE_FIELDS = [
  "title",
  "description",
  "priority",
  "status",
  "assignedTo",
  "estimatedTime",
  "actualTime",
  "startDate",
  "endDate",
];

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

exports.createBug = async (req, res) => {
  try {
    const body = pick(req.body, [...ALLOWED_UPDATE_FIELDS, "teamId"]);
    const bug = await bugService.createBug(req.user.id, body);
    res.status(201).json(bug);
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && status === 500
        ? "Server error"
        : error.message || "Server error";
    res.status(status).json({ message });
  }
};

exports.getBugs = async (req, res) => {
  try {
    const filters = {
      scope: req.query.scope,
      teamId: req.query.teamId,
      assignedTo: req.query.assignedTo,
      priority: req.query.priority,
      status: req.query.status,
      sort: req.query.sort || "createdAt",
      order: req.query.order || "desc",
      page: req.query.page,
      limit: req.query.limit,
    };
    const result = await bugService.getVisibleBugs(req.user.id, filters);
    res.json(result);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid filter value" });
    }
    const status = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && status === 500
        ? "Server error"
        : error.message || "Server error";
    res.status(status).json({ message });
  }
};

exports.getBugById = async (req, res) => {
  try {
    const bug = await bugService.getBugByIdIfAllowed(req.params.id, req.user.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });
    res.json(bug);
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && status === 500
        ? "Server error"
        : error.message || "Server error";
    res.status(status).json({ message });
  }
};

exports.updateBug = async (req, res) => {
  try {
    const updates = pick(req.body, ALLOWED_UPDATE_FIELDS);
    const bug = await bugService.updateBug(req.params.id, req.user.id, updates);
    if (!bug) return res.status(404).json({ message: "Bug not found" });
    res.json(bug);
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && status === 500
        ? "Server error"
        : error.message || "Server error";
    res.status(status).json({ message });
  }
};

exports.getBugActivity = async (req, res) => {
  try {
    const filters = {
      user: req.query.user,
      action: req.query.action,
      search: req.query.search,
    };
    const activities = await bugService.getBugActivityIfAllowed(
      req.params.id,
      req.user.id,
      filters
    );
    if (activities === null)
      return res.status(404).json({ message: "Bug not found" });
    res.json(activities);
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && status === 500
        ? "Server error"
        : error.message || "Server error";
    res.status(status).json({ message });
  }
};

exports.startWork = async (req, res) => {
  try {
    const bug = await bugService.startWork(req.params.id, req.user.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });
    res.json(bug);
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && status === 500
        ? "Server error"
        : error.message || "Server error";
    res.status(status).json({ message });
  }
};

exports.stopWork = async (req, res) => {
  try {
    const bug = await bugService.stopWork(req.params.id, req.user.id);
    if (!bug) return res.status(404).json({ message: "Bug not found" });
    res.json(bug);
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && status === 500
        ? "Server error"
        : error.message || "Server error";
    res.status(status).json({ message });
  }
};

exports.deleteBug = async (req, res) => {
  try {
    const deleted = await bugService.deleteBugIfAllowed(
      req.params.id,
      req.user.id
    );
    if (!deleted) return res.status(404).json({ message: "Bug not found" });
    res.json({ message: "Bug deleted" });
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && status === 500
        ? "Server error"
        : error.message || "Server error";
    res.status(status).json({ message });
  }
};

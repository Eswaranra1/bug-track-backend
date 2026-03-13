/**
 * Bug repository — database access only.
 * No business logic, no HTTP, no notifications/emails.
 */
const Bug = require("../models/Bug");

const POPULATE_LIST = [
  { path: "createdBy", select: "name email" },
  { path: "assignedTo", select: "name email" },
  { path: "teamId", select: "name" },
];
const POPULATE_DETAIL = [
  { path: "createdBy", select: "name email" },
  { path: "assignedTo", select: "name email" },
  { path: "teamId", select: "name description" },
];

exports.findWithFilters = async (query, sort, skip, limit) => {
  return Bug.find(query)
    .populate(POPULATE_LIST)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

exports.count = (query) => Bug.countDocuments(query);

exports.findById = (id, populate = true) => {
  const q = Bug.findById(id);
  if (populate) q.populate(POPULATE_DETAIL);
  return q.lean();
};

exports.findByIdLean = (id, select) => {
  let q = Bug.findById(id).lean();
  if (select) q = q.select(select);
  return q;
};

exports.create = (data) => Bug.create(data);

exports.updateById = (id, updates) =>
  Bug.findByIdAndUpdate(id, updates, { new: true })
    .populate(POPULATE_LIST)
    .lean();

exports.deleteById = (id) => Bug.findByIdAndDelete(id);

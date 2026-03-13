const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const bugCreateSchema = Joi.object({
  title: Joi.string().min(1).max(500).required(),
  description: Joi.string().max(10000).allow("", null),
  priority: Joi.string().valid("low", "medium", "high", "critical"),
  status: Joi.string().valid("open", "triaged", "in-progress", "in-review", "testing", "resolved", "closed"),
  teamId: Joi.string().hex().length(24).allow(null, ""),
  assignedTo: Joi.string().hex().length(24).allow(null, ""),
  estimatedTime: Joi.number().min(0).allow(null),
  actualTime: Joi.number().min(0).allow(null),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
});

const bugUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(500),
  description: Joi.string().max(10000).allow("", null),
  priority: Joi.string().valid("low", "medium", "high", "critical"),
  status: Joi.string().valid("open", "triaged", "in-progress", "in-review", "testing", "resolved", "closed"),
  assignedTo: Joi.string().hex().length(24).allow(null, ""),
  estimatedTime: Joi.number().min(0).allow(null),
  actualTime: Joi.number().min(0).allow(null),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
}).min(1);

const commentSchema = Joi.object({
  message: Joi.string().min(1).max(5000).required(),
  parentId: Joi.string().hex().length(24).allow(null, ""),
  mentionedUserIds: Joi.array().items(Joi.string().hex().length(24)).default([]),
});

const reactionSchema = Joi.object({
  emoji: Joi.string().min(1).max(20).required(),
});

const teamRoles = ["admin", "manager", "developer", "qa", "member"];

const teamCreateSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow("", null),
  members: Joi.array().items(
    Joi.object({
      userId: Joi.string().hex().length(24),
      email: Joi.string().email(),
      role: Joi.string().valid(...teamRoles).default("member"),
    }).or("userId", "email")
  ).default([]),
});

const teamUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(200),
  description: Joi.string().max(1000).allow("", null),
}).min(1);

const teamMemberSchema = Joi.object({
  userId: Joi.string().hex().length(24),
  email: Joi.string().email(),
  role: Joi.string().valid(...teamRoles).required(),
}).or("userId", "email");

function validate(schema, property = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      const message = error.details.map((d) => d.message).join("; ");
      return res.status(400).json({ message });
    }
    req[property] = value;
    next();
  };
}

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  bugCreateSchema,
  bugUpdateSchema,
  commentSchema,
  reactionSchema,
  teamCreateSchema,
  teamUpdateSchema,
  teamMemberSchema,
};

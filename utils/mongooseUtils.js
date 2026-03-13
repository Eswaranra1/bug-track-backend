const mongoose = require("mongoose");

/**
 * Returns true if value is a valid 24-char hex ObjectId string.
 */
function isValidObjectId(value) {
  if (value == null) return false;
  return mongoose.Types.ObjectId.isValid(value) && String(value).length === 24;
}

/**
 * Validate and return ObjectId or throw AppError.
 */
function parseObjectId(value, message = "Invalid ID") {
  if (!isValidObjectId(value)) {
    const AppError = require("./AppError");
    const { HttpStatus } = require("../constants/httpStatus");
    throw new AppError(message, HttpStatus.BAD_REQUEST);
  }
  return new mongoose.Types.ObjectId(value);
}

module.exports = { isValidObjectId, parseObjectId };

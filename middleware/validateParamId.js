const mongoose = require("mongoose");
const { HttpStatus, ApiMessage } = require("../constants/httpStatus");

/**
 * Validates that req.params[idParam] is a valid 24-char hex ObjectId.
 * Use on routes that have :id (e.g. /bugs/:id). Call before controller.
 */
function validateObjectId(idParam = "id") {
  return (req, res, next) => {
    const value = req.params[idParam];
    if (!value || !mongoose.Types.ObjectId.isValid(value) || String(value).length !== 24) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: ApiMessage.BAD_REQUEST });
    }
    next();
  };
}

module.exports = { validateObjectId };

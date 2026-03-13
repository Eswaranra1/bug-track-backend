/**
 * Centralized HTTP status codes and common API response patterns.
 * Use for consistent responses across all controllers.
 */
const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

const ApiMessage = {
  BAD_REQUEST: "Invalid request",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "Access denied",
  NOT_FOUND: "Resource not found",
  SERVER_ERROR: "Server error",
  INVALID_FILTER: "Invalid filter value",
  INVALID_FILE_TYPE: "Invalid file type. Only images and PDFs are allowed.",
  FILE_TOO_LARGE: "File too large (max 5MB)",
};

module.exports = { HttpStatus, ApiMessage };

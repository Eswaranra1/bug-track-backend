/**
 * Wraps async route handlers so errors are passed to Express error middleware.
 * Avoids repetitive try/catch in every controller.
 * @param {Function} fn - Async (req, res, next) => Promise
 * @returns {(req, res, next) => void}
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;

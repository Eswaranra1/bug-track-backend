/**
 * Application constants. Use for env defaults and shared config.
 */
module.exports = {
  DEFAULT_PORT: 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};

const jwt = require("jsonwebtoken");

/** Extract JWT from Authorization: Bearer <token> or raw token. */
function getToken(req) {
  const raw = req.headers.authorization;
  if (!raw) return null;
  if (raw.startsWith("Bearer ")) return raw.slice(7).trim();
  return raw.trim();
}

module.exports = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server configuration error" });
  }
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

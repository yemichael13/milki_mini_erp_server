const jwt = require("jsonwebtoken");
const { normalizeRole } = require("../utils/role");

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);
    if (decoded.type && decoded.type !== "access") throw new Error("Wrong token type");
    req.user = {
      ...decoded,
      id: decoded.sub || decoded.id,
      role: normalizeRole(decoded.role),
      raw_role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const buckets = new Map();

module.exports = (windowMs = 15 * 60 * 1000, max = 20) => (req, res, next) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now - current.startedAt > windowMs) { buckets.set(key, { startedAt: now, count: 1 }); return next(); }
  current.count += 1;
  if (current.count > max) return res.status(429).json({ message: "Too many requests" });
  next();
};

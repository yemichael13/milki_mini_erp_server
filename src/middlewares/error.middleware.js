const logger = require("../config/logger");

const errorMiddleware = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === "ValidationError" || (err.statusCode === 400 && err.details)) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.details?.map((d) => d.message) || [err.message],
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large" });
  }

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Resource already exists" });
  }

  if (err.code && err.code.startsWith("ER_")) {
    return res.status(500).json({ message: "Database error" });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
};

module.exports = errorMiddleware;

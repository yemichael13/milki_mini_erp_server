const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { req.cookies = Object.fromEntries((req.headers.cookie || "").split("; ").filter(Boolean).map((p) => { const i = p.indexOf("="); return [p.slice(0, i), decodeURIComponent(p.slice(i + 1))]; })); next(); });
app.use((req, res, next) => {
  res.cookie = (name, value, options = {}) => {
    const parts = [`${name}=${encodeURIComponent(value)}`];
    if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
    if (options.httpOnly) parts.push("HttpOnly"); if (options.secure) parts.push("Secure");
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`); if (options.path) parts.push(`Path=${options.path}`);
    res.append("Set-Cookie", parts.join("; "));
  };
  res.clearCookie = (name, options = {}) => res.cookie(name, "", { ...options, maxAge: 0 });
  next();
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/customers", require("./routes/customer.routes"));
app.use("/api/suppliers", require("./routes/supplier.routes"));
app.use("/api/transactions", require("./routes/transaction.routes"));
app.use("/api", require("./routes/inventory.routes"));
app.use("/api/input-movements", require("./routes/inputMovement.routes"));
app.use("/api/reports", require("./routes/report.routes"));

app.use(errorMiddleware);

module.exports = app;

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

// Serve uploaded files
const uploadDirName = process.env.UPLOAD_DIR || "uploads";
app.use("/uploads", express.static(path.join(__dirname, "..", uploadDirName)));

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/customers", require("./routes/customer.routes"));
app.use("/api/sales", require("./routes/sales.routes"));
app.use("/api/production", require("./routes/production.routes"));
app.use("/api/procurement", require("./routes/procurement.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/reports", require("./routes/report.routes"));

app.use(errorMiddleware);

module.exports = app;

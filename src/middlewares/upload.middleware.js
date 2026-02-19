const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirName = process.env.UPLOAD_DIR || "uploads";
const uploadDir = path.join(__dirname, "..", uploadDirName);
const maxSize = Number(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024; // 5MB
const allowedMimes = (process.env.UPLOAD_ALLOWED_MIMES || "image/jpeg,image/png,image/gif,application/pdf")
  .split(",")
  .map((m) => m.trim());

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || path.extname(file.mimetype) || "";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error("Invalid file type. Only image and PDF files are allowed.");
    err.statusCode = 400;
    cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize },
});

const uploadSingle = (fieldName = "receipt") => upload.single(fieldName);

module.exports = { upload, uploadSingle };

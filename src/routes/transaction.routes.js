const express = require("express");
const transactionController = require("../controllers/transaction.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { uploadSingle } = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(authMiddleware);

// All authenticated users can list transactions (with role-based filtering)
router.get("/", transactionController.list);

// Get transaction by ID
router.get("/:id", transactionController.getById);

// Department officers can create transactions
router.post(
  "/",
  roleMiddleware("sales", "procurement", "production"),
  uploadSingle("receipt"),
  transactionController.create
);

// Upload receipt for pending transactions
router.post(
  "/:id/receipt",
  roleMiddleware("sales", "procurement", "production"),
  uploadSingle("receipt"),
  transactionController.uploadReceipt
);

// Manager can approve transactions
router.post(
  "/:id/approve",
  roleMiddleware("general_manager"),
  transactionController.managerApprove
);

// Manager can reject transactions
router.post(
  "/:id/reject",
  roleMiddleware("general_manager"),
  transactionController.reject
);

module.exports = router;
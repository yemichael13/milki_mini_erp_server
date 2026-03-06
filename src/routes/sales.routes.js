const express = require("express");
const salesController = require("../controllers/sales.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { uploadSingle } = require("../middlewares/upload.middleware");
const {
  createSalesTransactionSchema,
  resubmitSalesTransactionSchema,
  listSalesQuerySchema,
  rejectSchema,
} = require("../validations/sales.validation");

const router = express.Router();

router.use(authMiddleware);

// Officer endpoints
router.get(
  "/mine",
  roleMiddleware("sales_officer"),
  validate(listSalesQuerySchema, "query"),
  salesController.listMine
);
router.post(
  "/",
  roleMiddleware("sales_officer"),
  uploadSingle("receipt"),
  validate(createSalesTransactionSchema),
  salesController.create
);
router.post(
  "/:id/receipt",
  roleMiddleware("sales_officer"),
  uploadSingle("receipt"),
  salesController.uploadReceipt
);
router.put(
  "/:id/resubmit",
  roleMiddleware("sales_officer"),
  validate(resubmitSalesTransactionSchema),
  salesController.resubmit
);

// Accountant / Manager endpoints
router.get(
  "/",
  roleMiddleware("accountant", "general_manager"),
  validate(listSalesQuerySchema, "query"),
  salesController.listAll
);
router.get(
  "/:id",
  roleMiddleware("accountant", "general_manager"),
  salesController.getById
);
router.post(
  "/:id/accountant-approve",
  roleMiddleware("accountant"),
  uploadSingle("receipt"),
  salesController.accountantApprove
);
router.post(
  "/:id/manager-approve",
  roleMiddleware("general_manager"),
  uploadSingle("receipt"),
  salesController.managerApprove
);
router.post(
  "/:id/reject",
  roleMiddleware("accountant", "general_manager"),
  uploadSingle("receipt"),
  validate(rejectSchema),
  salesController.reject
);

module.exports = router;

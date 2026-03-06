const express = require("express");
const procurementController = require("../controllers/procurement.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { uploadSingle } = require("../middlewares/upload.middleware");
const {
  createProcurementTransactionSchema,
  resubmitProcurementTransactionSchema,
  listProcurementQuerySchema,
  rejectSchema,
} = require("../validations/procurement.validation");

const router = express.Router();

router.use(authMiddleware);

// Officer endpoints
router.get(
  "/mine",
  roleMiddleware("procurement_officer"),
  validate(listProcurementQuerySchema, "query"),
  procurementController.listMine
);
router.post(
  "/",
  roleMiddleware("procurement_officer"),
  uploadSingle("receipt"),
  validate(createProcurementTransactionSchema),
  procurementController.create
);
router.post(
  "/:id/receipt",
  roleMiddleware("procurement_officer"),
  uploadSingle("receipt"),
  procurementController.uploadReceipt
);
router.put(
  "/:id/resubmit",
  roleMiddleware("procurement_officer"),
  validate(resubmitProcurementTransactionSchema),
  procurementController.resubmit
);

// Accountant / Manager endpoints
router.get(
  "/",
  roleMiddleware("accountant", "general_manager"),
  validate(listProcurementQuerySchema, "query"),
  procurementController.listAll
);
router.get(
  "/:id",
  roleMiddleware("accountant", "general_manager"),
  procurementController.getById
);
router.post(
  "/:id/accountant-approve",
  roleMiddleware("accountant"),
  uploadSingle("receipt"),
  procurementController.accountantApprove
);
router.post(
  "/:id/manager-approve",
  roleMiddleware("general_manager"),
  uploadSingle("receipt"),
  procurementController.managerApprove
);
router.post(
  "/:id/reject",
  roleMiddleware("accountant", "general_manager"),
  uploadSingle("receipt"),
  validate(rejectSchema),
  procurementController.reject
);

module.exports = router;

const express = require("express");
const productionController = require("../controllers/production.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { uploadSingle } = require("../middlewares/upload.middleware");
const {
  createProductionTransactionSchema,
  resubmitProductionTransactionSchema,
  listProductionQuerySchema,
  rejectSchema,
} = require("../validations/production.validation");

const router = express.Router();

router.use(authMiddleware);

// Officer endpoints
router.get(
  "/mine",
  roleMiddleware("production", "production_officer"),
  validate(listProductionQuerySchema, "query"),
  productionController.listMine
);
router.post(
  "/",
  roleMiddleware("production", "production_officer"),
  uploadSingle("receipt"),
  validate(createProductionTransactionSchema),
  productionController.create
);
router.post(
  "/:id/receipt",
  roleMiddleware("production", "production_officer"),
  uploadSingle("receipt"),
  productionController.uploadReceipt
);
router.put(
  "/:id/resubmit",
  roleMiddleware("production", "production_officer"),
  validate(resubmitProductionTransactionSchema),
  productionController.resubmit
);

// Accountant / Manager endpoints
router.get(
  "/",
  roleMiddleware("accountant", "general_manager"),
  validate(listProductionQuerySchema, "query"),
  productionController.listAll
);
router.get(
  "/:id",
  roleMiddleware("accountant", "general_manager"),
  productionController.getById
);
router.post(
  "/:id/accountant-approve",
  roleMiddleware("accountant"),
  uploadSingle("receipt"),
  productionController.accountantApprove
);
router.post(
  "/:id/manager-approve",
  roleMiddleware("general_manager"),
  uploadSingle("receipt"),
  productionController.managerApprove
);
router.post(
  "/:id/reject",
  roleMiddleware("accountant", "general_manager"),
  uploadSingle("receipt"),
  validate(rejectSchema),
  productionController.reject
);

module.exports = router;

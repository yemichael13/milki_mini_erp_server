const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { uploadSingle } = require("../middlewares/upload.middleware");
const supplierPaymentController = require("../controllers/supplierPayment.controller");
const {
  createSupplierPaymentSchema,
  listSupplierPaymentQuerySchema,
} = require("../validations/supplierPayment.validation");

const router = express.Router();

router.use(authMiddleware);

// View: Procurement officer only
router.get(
  "/",
  roleMiddleware("procurement_officer"),
  validate(listSupplierPaymentQuerySchema, "query"),
  supplierPaymentController.list
);

// Create: Procurement officer only
router.post(
  "/",
  roleMiddleware("procurement", "procurement_officer"),
  uploadSingle("receipt"),
  validate(createSupplierPaymentSchema),
  supplierPaymentController.create
);

module.exports = router;


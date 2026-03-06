const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { uploadSingle } = require("../middlewares/upload.middleware");
const customerPaymentController = require("../controllers/customerPayment.controller");
const {
  createCustomerPaymentSchema,
  listCustomerPaymentQuerySchema,
} = require("../validations/customerPayment.validation");

const router = express.Router();

router.use(authMiddleware);

// View: Sales officer only (no accountant/manager)
router.get(
  "/",
  roleMiddleware("sales_officer"),
  validate(listCustomerPaymentQuerySchema, "query"),
  customerPaymentController.list
);

// Create: Sales officer only
router.post(
  "/",
  roleMiddleware("sales_officer"),
  uploadSingle("receipt"),
  validate(createCustomerPaymentSchema),
  customerPaymentController.create
);

module.exports = router;


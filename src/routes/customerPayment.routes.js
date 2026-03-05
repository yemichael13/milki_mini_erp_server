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

// View: Accountant + General Manager
router.get(
  "/",
  roleMiddleware("accountant", "general_manager"),
  validate(listCustomerPaymentQuerySchema, "query"),
  customerPaymentController.list
);

// Create: Accountant only
router.post(
  "/",
  roleMiddleware("accountant"),
  uploadSingle("receipt"),
  validate(createCustomerPaymentSchema),
  customerPaymentController.create
);

module.exports = router;


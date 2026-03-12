const express = require("express");
const customerController = require("../controllers/customer.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { createCustomerSchema, customerSearchSchema } = require("../validations/customer.validation");

const router = express.Router();

router.use(authMiddleware);

// View customers: Sales, Accountant, General Manager (system admin excluded by spec)
router.get(
  "/",
  roleMiddleware("sales", "accountant", "general_manager"),
  validate(customerSearchSchema, "query"),
  customerController.list
);
router.get(
  "/:id",
  roleMiddleware("sales", "accountant", "general_manager"),
  customerController.getById
);

// Create customer: Sales only
router.post(
  "/",
  roleMiddleware("sales"),
  validate(createCustomerSchema),
  customerController.create
);

module.exports = router;

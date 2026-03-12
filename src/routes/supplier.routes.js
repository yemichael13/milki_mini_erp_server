const express = require("express");
const supplierController = require("../controllers/supplier.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { createSupplierSchema, supplierSearchSchema } = require("../validations/supplier.validation");

const router = express.Router();

router.use(authMiddleware);

// View suppliers: Procurement, Accountant, General Manager only
router.get(
  "/",
  roleMiddleware("procurement", "general_manager", "accountant"),
  validate(supplierSearchSchema, "query"),
  supplierController.list
);
router.get(
  "/:id",
  roleMiddleware("procurement", "general_manager", "accountant"),
  supplierController.getById
);

// Create supplier: Procurement only
router.post(
  "/",
  roleMiddleware("procurement"),
  validate(createSupplierSchema),
  supplierController.create
);

module.exports = router;

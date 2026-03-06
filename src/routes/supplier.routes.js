const express = require("express");
const supplierController = require("../controllers/supplier.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { createSupplierSchema, supplierSearchSchema } = require("../validations/supplier.validation");

const router = express.Router();

router.use(authMiddleware);

// View suppliers: Procurement Officer and General Manager only
router.get(
  "/",
  roleMiddleware("procurement_officer", "general_manager"),
  validate(supplierSearchSchema, "query"),
  supplierController.list
);
router.get(
  "/:id",
  roleMiddleware("procurement_officer", "general_manager"),
  supplierController.getById
);

// Create supplier: Procurement Officer only
router.post(
  "/",
  roleMiddleware("procurement_officer"),
  validate(createSupplierSchema),
  supplierController.create
);

module.exports = router;


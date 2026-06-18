const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const inventoryController = require("../controllers/inventory.controller");
const {
  inventoryListQuerySchema,
  createProductionRecordSchema,
  createProductReleaseSchema,
  createProductReturnSchema,
  rejectSchema,
} = require("../validations/inventory.validation");

const router = express.Router();

router.use(authMiddleware);

const readRoles = roleMiddleware(
  "production_recorder",
  "production_approver",
  "general_manager",
  "accountant",
  "system_admin"
);

router.get("/products", readRoles, validate(inventoryListQuerySchema, "query"), inventoryController.listProducts);

router.get(
  "/production-records",
  roleMiddleware("production_recorder", "production_approver", "general_manager", "accountant", "system_admin"),
  validate(inventoryListQuerySchema, "query"),
  inventoryController.listRecords("production")
);
router.post(
  "/production-records",
  roleMiddleware("production_recorder"),
  validate(createProductionRecordSchema),
  inventoryController.createRecord("production")
);
router.post(
  "/production-records/:id/approve",
  roleMiddleware("production_approver"),
  inventoryController.approveRecord("production")
);
router.post(
  "/production-records/:id/manager-approve",
  roleMiddleware("general_manager"),
  inventoryController.managerApproveRecord("production")
);
router.post(
  "/production-records/:id/reject",
  roleMiddleware("production_approver", "general_manager"),
  validate(rejectSchema),
  inventoryController.rejectRecord("production")
);

router.get(
  "/product-releases",
  roleMiddleware("production_recorder", "production_approver", "general_manager", "accountant", "system_admin"),
  validate(inventoryListQuerySchema, "query"),
  inventoryController.listRecords("release")
);
router.post(
  "/product-releases",
  roleMiddleware("production_recorder"),
  validate(createProductReleaseSchema),
  inventoryController.createRecord("release")
);
router.post(
  "/product-releases/:id/approve",
  roleMiddleware("production_approver"),
  inventoryController.approveRecord("release")
);
router.post(
  "/product-releases/:id/manager-approve",
  roleMiddleware("general_manager"),
  inventoryController.managerApproveRecord("release")
);
router.post(
  "/product-releases/:id/reject",
  roleMiddleware("production_approver", "general_manager"),
  validate(rejectSchema),
  inventoryController.rejectRecord("release")
);

router.get(
  "/product-returns",
  roleMiddleware("production_recorder", "production_approver", "general_manager", "accountant", "system_admin"),
  validate(inventoryListQuerySchema, "query"),
  inventoryController.listRecords("return")
);
router.post(
  "/product-returns",
  roleMiddleware("production_recorder"),
  validate(createProductReturnSchema),
  inventoryController.createRecord("return")
);
router.post(
  "/product-returns/:id/approve",
  roleMiddleware("production_approver"),
  inventoryController.approveRecord("return")
);
router.post(
  "/product-returns/:id/manager-approve",
  roleMiddleware("general_manager"),
  inventoryController.managerApproveRecord("return")
);
router.post(
  "/product-returns/:id/reject",
  roleMiddleware("production_approver", "general_manager"),
  validate(rejectSchema),
  inventoryController.rejectRecord("return")
);

router.get(
  "/inventory",
  roleMiddleware("production_recorder", "production_approver", "general_manager", "accountant", "system_admin"),
  inventoryController.getInventory
);
router.get(
  "/inventory/reports",
  roleMiddleware("production_recorder", "production_approver", "general_manager", "accountant", "system_admin"),
  validate(inventoryListQuerySchema, "query"),
  inventoryController.getReports
);

module.exports = router;

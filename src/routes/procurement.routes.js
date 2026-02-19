const express = require("express");
const createController = require("../controllers/transaction.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { uploadSingle } = require("../middlewares/upload.middleware");
const {
  createTransactionSchema,
  listQuerySchema,
  rejectBodySchema,
} = require("../validations/transaction.validation");

const router = express.Router();
const controller = createController("procurement");

router.use(authMiddleware);

router.get("/", validate(listQuerySchema, "query"), roleMiddleware("procurement", "accountant", "manager", "admin"), controller.list);
router.get("/:id", roleMiddleware("procurement", "accountant", "manager", "admin"), controller.getById);
router.post("/", roleMiddleware("procurement", "admin"), uploadSingle("receipt"), validate(createTransactionSchema), controller.create);
router.post("/:id/receipt", roleMiddleware("procurement", "admin"), uploadSingle("receipt"), controller.uploadReceipt);
router.post("/:id/accountant-approve", roleMiddleware("accountant", "admin"), controller.accountantApprove);
router.post("/:id/manager-approve", roleMiddleware("manager", "admin"), controller.managerApprove);
router.post("/:id/reject", roleMiddleware("accountant", "manager", "admin"), validate(rejectBodySchema), controller.reject);

module.exports = router;

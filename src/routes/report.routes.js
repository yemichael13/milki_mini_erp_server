const express = require("express");
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { reportQuerySchema } = require("../validations/report.validation");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("accountant", "general_manager"));

router.get("/customer-credit", validate(reportQuerySchema, "query"), reportController.customerCredit);
router.get("/supplier-debt", validate(reportQuerySchema, "query"), reportController.supplierDebt);
router.get("/summary", validate(reportQuerySchema, "query"), reportController.summary);

module.exports = router;

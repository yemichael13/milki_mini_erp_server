const express = require("express");
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { reportQuerySchema } = require("../validations/report.validation");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("accountant", "manager", "admin"));

router.get("/customer-credit", validate(reportQuerySchema, "query"), reportController.customerCredit);
router.get("/workflow-summary", validate(reportQuerySchema, "query"), reportController.workflowSummary);
router.get("/customer-credit/:customerId", validate(reportQuerySchema, "query"), reportController.customerCreditDetail);

module.exports = router;

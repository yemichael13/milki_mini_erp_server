const express = require("express");
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { uploadSingle } = require("../middlewares/upload.middleware");
const { createPaymentSchema, listQuerySchema } = require("../validations/payment.validation");

const router = express.Router();

router.use(authMiddleware);

router.get("/", validate(listQuerySchema, "query"), roleMiddleware("accountant", "manager", "admin"), paymentController.list);
router.get("/:id", roleMiddleware("accountant", "manager", "admin"), paymentController.getById);
router.post("/", roleMiddleware("accountant", "manager", "admin"), uploadSingle("receipt"), validate(createPaymentSchema), paymentController.create);

module.exports = router;

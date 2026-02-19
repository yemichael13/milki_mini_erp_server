const express = require("express");
const customerController = require("../controllers/customer.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { createCustomerSchema, updateCustomerSchema } = require("../validations/customer.validation");

const router = express.Router();

router.use(authMiddleware);

router.get("/", roleMiddleware("sales", "production", "procurement", "accountant", "manager", "admin"), customerController.list);
router.get("/:id", roleMiddleware("sales", "production", "procurement", "accountant", "manager", "admin"), customerController.getById);
router.post("/", roleMiddleware("sales", "production", "procurement", "admin"), validate(createCustomerSchema), customerController.create);
router.patch("/:id", roleMiddleware("sales", "production", "procurement", "admin"), validate(updateCustomerSchema), customerController.update);
router.delete("/:id", roleMiddleware("admin"), customerController.remove);

module.exports = router;

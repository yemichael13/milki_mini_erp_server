const express = require("express");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { createUserSchema, updateUserSchema } = require("../validations/user.validation");

const router = express.Router();

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "manager"), userController.list);
router.get("/:id", roleMiddleware("admin", "manager"), userController.getById);
router.post("/", roleMiddleware("admin"), validate(createUserSchema), userController.create);
router.patch("/:id", roleMiddleware("admin", "manager"), validate(updateUserSchema), userController.update);

module.exports = router;

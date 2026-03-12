const express = require("express");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { createUserSchema, updateUserSchema } = require("../validations/user.validation");

const router = express.Router();

router.use(authMiddleware);

// STRICT: only system admin can manage users
router.get("/", roleMiddleware("system_admin"), userController.list);
router.get("/:id", roleMiddleware("system_admin"), userController.getById);
router.post("/", roleMiddleware("system_admin"), validate(createUserSchema), userController.create);
router.patch("/:id", roleMiddleware("system_admin"), validate(updateUserSchema), userController.update);

module.exports = router;

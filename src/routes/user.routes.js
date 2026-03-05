const express = require("express");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { createUserSchema, updateUserSchema } = require("../validations/user.validation");

const router = express.Router();

router.use(authMiddleware);

// STRICT: only admin can manage users
router.get("/", roleMiddleware("admin"), userController.list);
router.get("/:id", roleMiddleware("admin"), userController.getById);
router.post("/", roleMiddleware("admin"), validate(createUserSchema), userController.create);
router.patch("/:id", roleMiddleware("admin"), validate(updateUserSchema), userController.update);

module.exports = router;

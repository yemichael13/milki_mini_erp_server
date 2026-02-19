const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { loginSchema, registerSchema } = require("../validations/auth.validation");

const router = express.Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/register", validate(registerSchema), authController.register);

router.get("/me", authMiddleware, authController.me);

module.exports = router;

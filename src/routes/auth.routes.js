const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { loginSchema } = require("../validations/auth.validation");

const router = express.Router();

router.post("/login", validate(loginSchema), authController.login);

router.get("/me", authMiddleware, authController.me);

module.exports = router;

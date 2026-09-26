const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const rateLimit = require("../middlewares/securityRateLimit.middleware");
const { loginSchema, emailSchema, resetSchema, changePasswordSchema } = require("../validations/auth.validation");

const router = express.Router();

router.post("/login", rateLimit(15 * 60 * 1000, 10), validate(loginSchema), authController.login);
router.post("/refresh", rateLimit(15 * 60 * 1000, 30), authController.refresh);
router.post("/logout", authController.logout);
router.get("/verify-email", rateLimit(15 * 60 * 1000, 20), authController.verifyEmail);
router.post("/forgot-password", rateLimit(15 * 60 * 1000, 10), validate(emailSchema), authController.forgotPassword);
router.post("/reset-password", rateLimit(15 * 60 * 1000, 10), validate(resetSchema), authController.resetPassword);
router.post("/change-password", authMiddleware, validate(changePasswordSchema), authController.changePassword);

router.get("/me", authMiddleware, authController.me);

module.exports = router;

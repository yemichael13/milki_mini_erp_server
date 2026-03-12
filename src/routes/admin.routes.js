const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("system_admin"));

router.get("/settings", adminController.getSettings);
router.post("/backups", adminController.triggerBackup);
router.get("/logs", adminController.viewLogs);

module.exports = router;

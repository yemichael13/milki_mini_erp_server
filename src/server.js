require("dotenv").config();
const app = require("./app");
const userService = require("./services/user.service");
const schemaService = require("./services/schema.service");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await schemaService.ensureUnifiedTransactionsTable();
    await schemaService.ensureProductionInventoryTables();
    await userService.ensureDefaultAdmin();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server bootstrap failed:", err);
    process.exitCode = 1;
  }
};

startServer();

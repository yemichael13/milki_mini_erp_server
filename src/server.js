require("dotenv").config();
const app = require("./app");
const userService = require("./services/user.service");
const schemaService = require("./services/schema.service");

const PORT = process.env.PORT || 5000;

// make sure default admin account exists before accepting connections
userService.ensureDefaultAdmin().catch((err) => {
  console.error("Failed to ensure default admin:", err);
});
schemaService.ensureUnifiedTransactionsTable().catch((err) => {
  console.error("Failed to ensure unified transactions table:", err);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

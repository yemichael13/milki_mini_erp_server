const pool = require("../config/db");
const productRepository = require("../repositories/product.repository");
const { PRODUCT_CATALOG } = require("../constants/productionInventory");

const tableExists = async (tableName) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [tableName]
  );
  return Number(rows[0]?.count || 0) > 0;
};

const ensureUnifiedTransactionsTable = async () => {
  const requiredTables = ["users", "customers", "suppliers"];
  const missing = [];
  for (const t of requiredTables) {
    if (!(await tableExists(t))) missing.push(t);
  }
  if (missing.length) {
    const err = new Error(`Missing required tables: ${missing.join(", ")}`);
    err.statusCode = 500;
    throw err;
  }

  if (await tableExists("transactions")) {
    await ensureAccountantStatusEnum();
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      type ENUM('sale', 'procurement', 'production') NOT NULL,
      source_department ENUM('sales', 'procurement', 'production') NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      payment_type ENUM('paid', 'credit', 'debt') NOT NULL,
      customer_id INT NULL,
      supplier_id INT NULL,
      status ENUM('pending', 'accountant_approved', 'manager_approved', 'rejected') NOT NULL DEFAULT 'pending',
      receipt_image VARCHAR(500),
      description TEXT,
      created_by INT NOT NULL,
      manager_approved_by INT NULL,
      rejected_by INT NULL,
      rejection_reason TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (manager_approved_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_type (type),
      INDEX idx_source_department (source_department),
      INDEX idx_status (status),
      INDEX idx_customer_id (customer_id),
      INDEX idx_supplier_id (supplier_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await ensureAccountantStatusEnum();
};

const ensureAccountantStatusEnum = async () => {
  const [rows] = await pool.query("SHOW COLUMNS FROM transactions LIKE 'status'");
  const type = rows?.[0]?.Type || rows?.[0]?.type;
  if (!type || !type.startsWith("enum(")) return;
  if (type.includes("accountant_approved")) return;
  await pool.query(`
    ALTER TABLE transactions
    MODIFY status ENUM('pending', 'accountant_approved', 'manager_approved', 'rejected')
    NOT NULL DEFAULT 'pending'
  `);
};

const ensureUserRoleEnum = async () => {
  const [rows] = await pool.query("SHOW COLUMNS FROM users LIKE 'role'");
  const type = rows?.[0]?.Type || rows?.[0]?.type;
  if (!type || !type.startsWith("enum(")) return;

  const desiredRoles = [
    "admin",
    "system_admin",
    "manager",
    "general_manager",
    "accountant",
    "sales",
    "procurement",
    "production",
    "sales_officer",
    "procurement_officer",
    "production_officer",
    "production_recorder",
    "production_approver",
  ];

  const existingValues = type
    .slice(5, -1)
    .split(",")
    .map((value) => value.trim().replace(/^'(.*)'$/, "$1"));
  const hasAllDesired = desiredRoles.every((role) => existingValues.includes(role));
  if (hasAllDesired) return;

  await pool.query(
    `
      ALTER TABLE users
      MODIFY role ENUM(${desiredRoles.map((role) => `'${role}'`).join(", ")})
      NOT NULL
    `
  );
};

const ensureProductionInventoryTables = async () => {
  if (!(await tableExists("users"))) {
    const err = new Error("Missing required table: users");
    err.statusCode = 500;
    throw err;
  }

  await ensureUserRoleEnum();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT PRIMARY KEY AUTO_INCREMENT,
      product_type VARCHAR(120) NOT NULL,
      package_size_kg DECIMAL(10, 2) NOT NULL,
      package_label VARCHAR(50) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_product_package (product_type, package_size_kg),
      INDEX idx_product_type (product_type),
      INDEX idx_package_size (package_size_kg),
      INDEX idx_product_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const inventoryTableSQL = (tableName, dateField) => `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INT PRIMARY KEY AUTO_INCREMENT,
      product_id INT NOT NULL,
      quantity_pieces INT NOT NULL,
      total_weight_quintal DECIMAL(15, 2) NOT NULL,
      ${dateField} DATE NOT NULL,
      description TEXT,
      status ENUM('production_pending', 'production_approved', 'manager_pending', 'manager_approved', 'rejected') NOT NULL DEFAULT 'production_pending',
      created_by INT NOT NULL,
      approved_by INT NULL,
      approved_at DATETIME NULL,
      manager_approved_by INT NULL,
      manager_approved_at DATETIME NULL,
      rejection_reason TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (manager_approved_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_${tableName}_product (product_id),
      INDEX idx_${tableName}_status (status),
      INDEX idx_${tableName}_created_by (created_by),
      INDEX idx_${tableName}_approved_by (approved_by),
      INDEX idx_${tableName}_manager_approved_by (manager_approved_by),
      INDEX idx_${tableName}_date (${dateField})
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.query(inventoryTableSQL("production_records", "production_date"));
  await pool.query(inventoryTableSQL("product_releases", "release_date"));
  await pool.query(inventoryTableSQL("product_returns", "return_date"));

  await productRepository.seedProducts(PRODUCT_CATALOG);
  await ensureSecurityAndInventoryFields();
};

const ensureSecurityAndInventoryFields = async () => {
  const addColumn = async (table, column, definition) => {
    const [rows] = await pool.query("SELECT COUNT(*) AS count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?", [table, column]);
    if (!Number(rows[0].count)) await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  };
  for (const [name, def] of [["email_verified_at", "DATETIME NULL"], ["email_verification_token_hash", "CHAR(64) NULL"], ["email_verification_expires_at", "DATETIME NULL"], ["password_reset_token_hash", "CHAR(64) NULL"], ["password_reset_expires_at", "DATETIME NULL"], ["failed_login_attempts", "INT NOT NULL DEFAULT 0"], ["locked_until", "DATETIME NULL"]]) await addColumn("users", name, def);
  await pool.query("UPDATE users SET email_verified_at = COALESCE(email_verified_at, created_at) WHERE is_active = 1");
  await pool.query("CREATE TABLE IF NOT EXISTS refresh_tokens (id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL, token_hash CHAR(64) NOT NULL UNIQUE, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, revoked_at DATETIME NULL, last_used_at DATETIME NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_refresh_user (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  await pool.query("CREATE TABLE IF NOT EXISTS security_events (id BIGINT PRIMARY KEY AUTO_INCREMENT, event_type VARCHAR(80) NOT NULL, user_id INT NULL, metadata JSON NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL, INDEX idx_security_user (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  await pool.query("CREATE TABLE IF NOT EXISTS input_movements (id BIGINT PRIMARY KEY AUTO_INCREMENT, product_id INT NOT NULL, movement_type ENUM('receipt','issue','return') NOT NULL, quantity_pieces INT NOT NULL, total_weight_quintal DECIMAL(15,2) NOT NULL, movement_date DATE NOT NULL, description TEXT NULL, status ENUM('production_pending','production_approved','manager_pending','manager_approved','rejected') NOT NULL DEFAULT 'production_pending', created_by INT NOT NULL, approved_by INT NULL, approved_at DATETIME NULL, manager_approved_by INT NULL, manager_approved_at DATETIME NULL, rejection_reason TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT, FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT, FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL, FOREIGN KEY (manager_approved_by) REFERENCES users(id) ON DELETE SET NULL, INDEX idx_input_product (product_id), INDEX idx_input_type (movement_type), INDEX idx_input_status (status), INDEX idx_input_date (movement_date)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  await addColumn("products", "inventory_type", "ENUM('INPUT','OUTPUT') NOT NULL DEFAULT 'OUTPUT'");
  await pool.query("UPDATE products SET inventory_type = 'OUTPUT' WHERE inventory_type IS NULL OR inventory_type = ''");
  await pool.query("INSERT INTO products (product_type, package_size_kg, package_label, inventory_type, is_active) SELECT 'Wheat', 50, '50kg', 'INPUT', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_type = 'Wheat')");
  await pool.query("INSERT INTO products (product_type, package_size_kg, package_label, inventory_type, is_active) SELECT 'Maize', 50, '50kg', 'INPUT', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_type = 'Maize')");
};

module.exports = {
  ensureUnifiedTransactionsTable,
  ensureProductionInventoryTables,
  ensureSecurityAndInventoryFields,
};

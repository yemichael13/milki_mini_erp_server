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
};

module.exports = {
  ensureUnifiedTransactionsTable,
  ensureProductionInventoryTables,
};

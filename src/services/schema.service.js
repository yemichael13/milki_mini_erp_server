const pool = require("../config/db");

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

module.exports = { ensureUnifiedTransactionsTable };

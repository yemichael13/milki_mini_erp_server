const pool = require("../config/db");

const TYPES = Object.freeze(["sale", "procurement", "production"]);
const SOURCE_DEPARTMENTS = Object.freeze(["sales", "procurement", "production"]);
const PAYMENT_TYPES = Object.freeze(["paid", "credit", "debt"]);
const STATUS = Object.freeze(["pending", "manager_approved", "rejected"]);

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT t.*,
            t.receipt_image as receipt_path,
            c.name as customer_name,
            s.name as supplier_name,
            u.full_name as created_by_name
     FROM transactions t
     LEFT JOIN customers c ON t.customer_id = c.id
     LEFT JOIN suppliers s ON t.supplier_id = s.id
     LEFT JOIN users u ON t.created_by = u.id
     WHERE t.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO transactions (type, source_department, amount, payment_type, customer_id, supplier_id, receipt_image, description, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.type,
      data.source_department,
      data.amount,
      data.payment_type,
      data.customer_id || null,
      data.supplier_id || null,
      data.receipt_image || null,
      data.description || null,
      data.created_by,
    ]
  );
  return result.insertId;
};

const findAll = async (filters = {}) => {
  let sql = `SELECT t.*,
                    t.receipt_image as receipt_path,
                    c.name as customer_name,
                    s.name as supplier_name,
                    u.full_name as created_by_name
             FROM transactions t
             LEFT JOIN customers c ON t.customer_id = c.id
             LEFT JOIN suppliers s ON t.supplier_id = s.id
             LEFT JOIN users u ON t.created_by = u.id
             WHERE 1=1`;
  const params = [];

  if (filters.type) {
    sql += " AND t.type = ?";
    params.push(filters.type);
  }
  if (filters.source_department) {
    sql += " AND t.source_department = ?";
    params.push(filters.source_department);
  }
  if (filters.status) {
    sql += " AND t.status = ?";
    params.push(filters.status);
  }
  if (filters.customer_id) {
    sql += " AND t.customer_id = ?";
    params.push(filters.customer_id);
  }
  if (filters.supplier_id) {
    sql += " AND t.supplier_id = ?";
    params.push(filters.supplier_id);
  }
  if (filters.created_by) {
    sql += " AND t.created_by = ?";
    params.push(filters.created_by);
  }
  if (filters.from_date) {
    sql += " AND DATE(t.created_at) >= ?";
    params.push(filters.from_date);
  }
  if (filters.to_date) {
    sql += " AND DATE(t.created_at) <= ?";
    params.push(filters.to_date);
  }

  sql += " ORDER BY t.created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

const updateStatus = async (id, status, userId, rejectionReason = null) => {
  const updates = ["status = ?", "updated_at = CURRENT_TIMESTAMP"];
  const values = [status];

  if (status === "manager_approved") {
    updates.push("manager_approved_by = ?");
    values.push(userId);
  } else if (status === "rejected") {
    updates.push("rejected_by = ?", "rejection_reason = ?");
    values.push(userId, rejectionReason);
  }

  values.push(id);
  const [result] = await pool.query(
    `UPDATE transactions SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
  return result.affectedRows;
};

const updateReceipt = async (id, receiptPath) => {
  const [result] = await pool.query(
    "UPDATE transactions SET receipt_image = ? WHERE id = ?",
    [receiptPath, id]
  );
  return result.affectedRows;
};

// Financial calculation methods - only manager_approved transactions affect totals
const getCustomerCredit = async (customerId) => {
  // Sum of credit transactions minus sum of paid transactions for this customer
  const [rows] = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN payment_type = 'credit' THEN amount ELSE 0 END), 0) as total_credit,
       COALESCE(SUM(CASE WHEN payment_type = 'paid' THEN amount ELSE 0 END), 0) as total_paid
     FROM transactions
     WHERE customer_id = ? AND status = 'manager_approved' AND type = 'sale'`,
    [customerId]
  );
  const totalCredit = Number(rows[0].total_credit);
  const totalPaid = Number(rows[0].total_paid);
  if (totalCredit === 0) return 0;
  return totalCredit - totalPaid;
};

const getSupplierDebt = async (supplierId) => {
  // Sum of debt transactions minus sum of paid transactions for this supplier
  const [rows] = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN payment_type = 'debt' THEN amount ELSE 0 END), 0) as total_debt,
       COALESCE(SUM(CASE WHEN payment_type = 'paid' THEN amount ELSE 0 END), 0) as total_paid
     FROM transactions
     WHERE supplier_id = ? AND status = 'manager_approved' AND type = 'procurement'`,
    [supplierId]
  );
  const totalDebt = Number(rows[0].total_debt);
  const totalPaid = Number(rows[0].total_paid);
  if (totalDebt === 0) return 0;
  return totalDebt - totalPaid;
};

const getDepartmentTransactions = async (sourceDepartment, userRole = null) => {
  let sql = `SELECT t.*,
                    t.receipt_image as receipt_path,
                    c.name as customer_name,
                    s.name as supplier_name,
                    u.full_name as created_by_name
             FROM transactions t
             LEFT JOIN customers c ON t.customer_id = c.id
             LEFT JOIN suppliers s ON t.supplier_id = s.id
             LEFT JOIN users u ON t.created_by = u.id
             WHERE t.source_department = ?`;

  const params = [sourceDepartment];

  // Role-based filtering
  if (userRole === 'sales') {
    sql += " AND t.source_department = 'sales'";
  } else if (userRole === 'procurement') {
    sql += " AND t.source_department = 'procurement'";
  } else if (userRole === 'production') {
    sql += " AND t.source_department = 'production'";
  }
  // accountant and general_manager can see all

  sql += " ORDER BY t.created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

module.exports = {
  TYPES,
  SOURCE_DEPARTMENTS,
  PAYMENT_TYPES,
  STATUS,
  findById,
  create,
  findAll,
  updateStatus,
  updateReceipt,
  getCustomerCredit,
  getSupplierDebt,
  getDepartmentTransactions,
};

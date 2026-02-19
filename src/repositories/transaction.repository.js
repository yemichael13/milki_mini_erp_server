const pool = require("../config/db");

const WORKFLOW = Object.freeze(["sales", "production", "procurement"]);
const STATUS = Object.freeze([
  "pending",
  "accountant_approved",
  "manager_approved",
  "rejected",
]);

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT t.*, c.name as customer_name 
     FROM transactions t 
     JOIN customers c ON t.customer_id = c.id 
     WHERE t.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO transactions (customer_id, workflow, status, total_amount, description, receipt_path, created_by)
     VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
    [
      data.customer_id,
      data.workflow,
      data.total_amount,
      data.description || null,
      data.receipt_path || null,
      data.created_by,
    ]
  );
  return result.insertId;
};

const findAll = async (filters = {}) => {
  let sql = `SELECT t.*, c.name as customer_name 
             FROM transactions t 
             JOIN customers c ON t.customer_id = c.id 
             WHERE 1=1`;
  const params = [];
  if (filters.workflow) {
    sql += " AND t.workflow = ?";
    params.push(filters.workflow);
  }
  if (filters.status) {
    sql += " AND t.status = ?";
    params.push(filters.status);
  }
  if (filters.customer_id) {
    sql += " AND t.customer_id = ?";
    params.push(filters.customer_id);
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
  if (status === "accountant_approved") {
    updates.push("accountant_approved_by = ?");
    values.push(userId);
  } else if (status === "manager_approved") {
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
    "UPDATE transactions SET receipt_path = ? WHERE id = ?",
    [receiptPath, id]
  );
  return result.affectedRows;
};

const getSumByCustomerAndStatus = async (customerId, status = "manager_approved") => {
  const [rows] = await pool.query(
    "SELECT COALESCE(SUM(total_amount), 0) as total FROM transactions WHERE customer_id = ? AND status = ?",
    [customerId, status]
  );
  return Number(rows[0].total);
};

module.exports = {
  WORKFLOW,
  STATUS,
  findById,
  create,
  findAll,
  updateStatus,
  updateReceipt,
  getSumByCustomerAndStatus,
};

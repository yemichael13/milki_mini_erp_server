const pool = require("../config/db");

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO sales_transactions
      (customer_id, amount, description, receipt_url, status, payment_type, created_by)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [
      data.customer_id,
      data.amount,
      data.description || null,
      data.receipt_url || null,
      data.payment_type,
      data.created_by,
    ]
  );
  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT st.*, c.name AS customer_name
     FROM sales_transactions st
     JOIN customers c ON c.id = st.customer_id
     WHERE st.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const listMine = async (userId, status = null) => {
  let sql = `SELECT st.*, c.name AS customer_name
             FROM sales_transactions st
             JOIN customers c ON c.id = st.customer_id
             WHERE st.created_by = ?`;
  const params = [userId];
  if (status) {
    sql += " AND st.status = ?";
    params.push(status);
  }
  sql += " ORDER BY st.created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

const listAll = async (status = null) => {
  let sql = `SELECT st.*, c.name AS customer_name
             FROM sales_transactions st
             JOIN customers c ON c.id = st.customer_id
             ORDER BY st.created_at DESC`;
  const params = [];
  if (status) {
    sql = `SELECT st.*, c.name AS customer_name
           FROM sales_transactions st
           JOIN customers c ON c.id = st.customer_id
           WHERE st.status = ?
           ORDER BY st.created_at DESC`;
    params.push(status);
  }
  const [rows] = await pool.query(sql, params);
  return rows;
};

const updateReceipt = async (id, receiptUrl) => {
  const [result] = await pool.query(
    `UPDATE sales_transactions
     SET receipt_url = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [receiptUrl, id]
  );
  return result.affectedRows;
};

const resubmit = async (id, data) => {
  const [result] = await pool.query(
    `UPDATE sales_transactions
     SET customer_id = ?,
         amount = ?,
         description = ?,
         payment_type = ?,
         status = 'pending',
         accountant_approved_by = NULL,
         manager_approved_by = NULL,
         rejected_by = NULL,
         rejection_reason = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      data.customer_id,
      data.amount,
      data.description || null,
      data.payment_type,
      id,
    ]
  );
  return result.affectedRows;
};

const setAccountantApproved = async (id, userId) => {
  const [result] = await pool.query(
    `UPDATE sales_transactions
     SET status = 'accountant_approved',
         accountant_approved_by = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId, id]
  );
  return result.affectedRows;
};

const setManagerApproved = async (id, userId) => {
  const [result] = await pool.query(
    `UPDATE sales_transactions
     SET status = 'manager_approved',
         manager_approved_by = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId, id]
  );
  return result.affectedRows;
};

const setRejected = async (id, userId, reason) => {
  const [result] = await pool.query(
    `UPDATE sales_transactions
     SET status = 'rejected',
         rejected_by = ?,
         rejection_reason = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId, reason || null, id]
  );
  return result.affectedRows;
};

module.exports = {
  create,
  findById,
  listMine,
  listAll,
  updateReceipt,
  resubmit,
  setAccountantApproved,
  setManagerApproved,
  setRejected,
};


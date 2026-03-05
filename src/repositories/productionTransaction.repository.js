const pool = require("../config/db");

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO production_transactions
      (amount, description, receipt_url, status, created_by)
     VALUES (?, ?, ?, 'pending', ?)`,
    [data.amount, data.description || null, data.receipt_url || null, data.created_by]
  );
  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT * FROM production_transactions WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
};

const listMine = async (userId, status = null) => {
  let sql = `SELECT * FROM production_transactions WHERE created_by = ?`;
  const params = [userId];
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  sql += " ORDER BY created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

const listAll = async (status = null) => {
  let sql = `SELECT * FROM production_transactions ORDER BY created_at DESC`;
  const params = [];
  if (status) {
    sql = `SELECT * FROM production_transactions WHERE status = ? ORDER BY created_at DESC`;
    params.push(status);
  }
  const [rows] = await pool.query(sql, params);
  return rows;
};

const updateReceipt = async (id, receiptUrl) => {
  const [result] = await pool.query(
    `UPDATE production_transactions
     SET receipt_url = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [receiptUrl, id]
  );
  return result.affectedRows;
};

const resubmit = async (id, data) => {
  const [result] = await pool.query(
    `UPDATE production_transactions
     SET amount = ?,
         description = ?,
         status = 'pending',
         accountant_approved_by = NULL,
         manager_approved_by = NULL,
         rejected_by = NULL,
         rejection_reason = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [data.amount, data.description || null, id]
  );
  return result.affectedRows;
};

const setAccountantApproved = async (id, userId) => {
  const [result] = await pool.query(
    `UPDATE production_transactions
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
    `UPDATE production_transactions
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
    `UPDATE production_transactions
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


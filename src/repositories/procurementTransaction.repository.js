const pool = require("../config/db");

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO procurement_transactions
      (supplier_id, amount, description, receipt_url, status, payment_type, created_by)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [
      data.supplier_id,
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
    `SELECT pt.*, s.name AS supplier_name
     FROM procurement_transactions pt
     JOIN suppliers s ON s.id = pt.supplier_id
     WHERE pt.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const listMine = async (userId, status = null) => {
  let sql = `SELECT pt.*, s.name AS supplier_name
             FROM procurement_transactions pt
             JOIN suppliers s ON s.id = pt.supplier_id
             WHERE pt.created_by = ?`;
  const params = [userId];
  if (status) {
    if (status === 'approved') {
      sql += " AND pt.status IN ('accountant_approved','manager_approved')";
    } else {
      sql += " AND pt.status = ?";
      params.push(status);
    }
  }
  sql += " ORDER BY pt.created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

const listAll = async (status = null) => {
  let sql = `SELECT pt.*, s.name AS supplier_name
             FROM procurement_transactions pt
             JOIN suppliers s ON s.id = pt.supplier_id
             ORDER BY pt.created_at DESC`;
  const params = [];
  if (status) {
    if (status === 'approved') {
      sql = `SELECT pt.*, s.name AS supplier_name
             FROM procurement_transactions pt
             JOIN suppliers s ON s.id = pt.supplier_id
             WHERE pt.status IN ('accountant_approved','manager_approved')
             ORDER BY pt.created_at DESC`;
    } else {
      sql = `SELECT pt.*, s.name AS supplier_name
             FROM procurement_transactions pt
             JOIN suppliers s ON s.id = pt.supplier_id
             WHERE pt.status = ?
             ORDER BY pt.created_at DESC`;
      params.push(status);
    }
  }
  const [rows] = await pool.query(sql, params);
  return rows;
};

const updateReceipt = async (id, receiptUrl) => {
  const [result] = await pool.query(
    `UPDATE procurement_transactions
     SET receipt_url = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [receiptUrl, id]
  );
  return result.affectedRows;
};

const resubmit = async (id, data) => {
  const [result] = await pool.query(
    `UPDATE procurement_transactions
     SET supplier_id = ?,
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
      data.supplier_id,
      data.amount,
      data.description || null,
      data.payment_type,
      id,
    ]
  );
  return result.affectedRows;
};

const setAccountantApproved = async (id, userId, description = null, receiptUrl = null) => {
  const [result] = await pool.query(
    `UPDATE procurement_transactions
     SET status = 'accountant_approved',
         accountant_approved_by = ?,
         approval_description = ?,
         approval_receipt_url = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId, description, receiptUrl, id]
  );
  return result.affectedRows;
};

const setManagerApproved = async (id, userId, description = null, receiptUrl = null) => {
  const [result] = await pool.query(
    `UPDATE procurement_transactions
     SET status = 'manager_approved',
         manager_approved_by = ?,
         approval_description = ?,
         approval_receipt_url = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId, description, receiptUrl, id]
  );
  return result.affectedRows;
};

const setRejected = async (id, userId, reason, receiptUrl = null) => {
  const [result] = await pool.query(
    `UPDATE procurement_transactions
     SET status = 'rejected',
         rejected_by = ?,
         rejection_reason = ?,
         rejection_receipt_url = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId, reason || null, receiptUrl, id]
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


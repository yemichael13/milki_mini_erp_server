const pool = require("../config/db");

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO supplier_payments
      (supplier_id, amount, payment_date, reference, receipt_url, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.supplier_id,
      data.amount,
      data.payment_date,
      data.reference || null,
      data.receipt_url || null,
      data.recorded_by,
    ]
  );
  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT sp.*, s.name AS supplier_name
     FROM supplier_payments sp
     JOIN suppliers s ON s.id = sp.supplier_id
     WHERE sp.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const list = async (filters = {}) => {
  let sql = `SELECT sp.*, s.name AS supplier_name
             FROM supplier_payments sp
             JOIN suppliers s ON s.id = sp.supplier_id
             WHERE 1=1`;
  const params = [];

  if (filters.supplier_id) {
    sql += " AND sp.supplier_id = ?";
    params.push(filters.supplier_id);
  }
  if (filters.from_date) {
    sql += " AND sp.payment_date >= ?";
    params.push(filters.from_date);
  }
  if (filters.to_date) {
    sql += " AND sp.payment_date <= ?";
    params.push(filters.to_date);
  }

  sql += " ORDER BY sp.payment_date DESC, sp.created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

module.exports = { create, findById, list };


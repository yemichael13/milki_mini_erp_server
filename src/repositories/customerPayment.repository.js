const pool = require("../config/db");

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO customer_payments
      (customer_id, amount, payment_date, reference, receipt_url, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.customer_id,
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
    `SELECT cp.*, c.name AS customer_name
     FROM customer_payments cp
     JOIN customers c ON c.id = cp.customer_id
     WHERE cp.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const list = async (filters = {}) => {
  let sql = `SELECT cp.*, c.name AS customer_name
             FROM customer_payments cp
             JOIN customers c ON c.id = cp.customer_id
             WHERE 1=1`;
  const params = [];

  if (filters.customer_id) {
    sql += " AND cp.customer_id = ?";
    params.push(filters.customer_id);
  }
  if (filters.from_date) {
    sql += " AND cp.payment_date >= ?";
    params.push(filters.from_date);
  }
  if (filters.to_date) {
    sql += " AND cp.payment_date <= ?";
    params.push(filters.to_date);
  }

  sql += " ORDER BY cp.payment_date DESC, cp.created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

module.exports = { create, findById, list };


const pool = require("../config/db");

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.name as customer_name 
     FROM payments p 
     JOIN customers c ON p.customer_id = c.id 
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO payments (customer_id, amount, payment_date, reference, receipt_path, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.customer_id,
      data.amount,
      data.payment_date,
      data.reference || null,
      data.receipt_path || null,
      data.recorded_by,
    ]
  );
  return result.insertId;
};

const findAll = async (filters = {}) => {
  let sql = `SELECT p.*, c.name as customer_name 
             FROM payments p 
             JOIN customers c ON p.customer_id = c.id 
             WHERE 1=1`;
  const params = [];
  if (filters.customer_id) {
    sql += " AND p.customer_id = ?";
    params.push(filters.customer_id);
  }
  if (filters.from_date) {
    sql += " AND p.payment_date >= ?";
    params.push(filters.from_date);
  }
  if (filters.to_date) {
    sql += " AND p.payment_date <= ?";
    params.push(filters.to_date);
  }
  sql += " ORDER BY p.payment_date DESC, p.created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

const getSumByCustomer = async (customerId, fromDate = null, toDate = null) => {
  let sql =
    "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE customer_id = ?";
  const params = [customerId];
  if (fromDate) {
    sql += " AND payment_date >= ?";
    params.push(fromDate);
  }
  if (toDate) {
    sql += " AND payment_date <= ?";
    params.push(toDate);
  }
  const [rows] = await pool.query(sql, params);
  return Number(rows[0].total);
};

module.exports = {
  findById,
  create,
  findAll,
  getSumByCustomer,
};

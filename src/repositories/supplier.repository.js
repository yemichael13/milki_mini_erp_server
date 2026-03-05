const pool = require("../config/db");

const findById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, address, created_by, created_at FROM suppliers WHERE id = ?",
    [id]
  );
  return rows[0] || null;
};

const create = async (data, createdBy) => {
  const [result] = await pool.query(
    "INSERT INTO suppliers (name, email, phone, address, created_by) VALUES (?, ?, ?, ?, ?)",
    [data.name, data.email || null, data.phone || null, data.address || null, createdBy]
  );
  return result.insertId;
};

const findAll = async (search = "") => {
  let sql =
    "SELECT id, name, email, phone, address, created_by, created_at FROM suppliers WHERE 1=1";
  const params = [];
  if (search) {
    sql += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  sql += " ORDER BY name ASC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

module.exports = {
  findById,
  create,
  findAll,
};


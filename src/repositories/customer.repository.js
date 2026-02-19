const pool = require("../config/db");

const findById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, address, created_at FROM customers WHERE id = ?",
    [id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    "INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)",
    [data.name, data.email || null, data.phone || null, data.address || null]
  );
  return result.insertId;
};

const findAll = async (search = "") => {
  let sql =
    "SELECT id, name, email, phone, address, created_at FROM customers WHERE 1=1";
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

const update = async (id, data) => {
  const [result] = await pool.query(
    "UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?",
    [
      data.name,
      data.email ?? null,
      data.phone ?? null,
      data.address ?? null,
      id,
    ]
  );
  return result.affectedRows;
};

const deleteById = async (id) => {
  const [result] = await pool.query("DELETE FROM customers WHERE id = ?", [
    id,
  ]);
  return result.affectedRows;
};

module.exports = {
  findById,
  create,
  findAll,
  update,
  deleteById,
};

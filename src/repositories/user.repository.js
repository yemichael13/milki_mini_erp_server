const pool = require("../config/db");

const findByEmail = async (email) => {
  const [rows] = await pool.query(
    "SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = ?",
    [email]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = ?",
    [id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)",
    [data.email, data.password_hash, data.full_name, data.role]
  );
  return result.insertId;
};

const findAll = async (filters = {}) => {
  let sql = "SELECT id, email, full_name, role, is_active, created_at FROM users WHERE 1=1";
  const params = [];
  if (filters.role) {
    sql += " AND role = ?";
    params.push(filters.role);
  }
  if (filters.is_active !== undefined) {
    sql += " AND is_active = ?";
    params.push(filters.is_active ? 1 : 0);
  }
  sql += " ORDER BY created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

const update = async (id, data) => {
  const allowed = ["full_name", "role", "is_active", "password_hash"];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (updates.length === 0) return 0;
  values.push(id);
  const [result] = await pool.query(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
  return result.affectedRows;
};

module.exports = {
  findByEmail,
  findById,
  create,
  findAll,
  update,
};

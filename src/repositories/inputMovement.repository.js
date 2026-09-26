const pool = require("../config/db");

const baseSelect = `SELECT m.*, p.product_type, p.package_size_kg, p.package_label, p.inventory_type,
  creator.full_name AS created_by_name, approver.full_name AS approved_by_name,
  manager.full_name AS manager_approved_by_name
  FROM input_movements m JOIN products p ON p.id = m.product_id
  LEFT JOIN users creator ON creator.id = m.created_by
  LEFT JOIN users approver ON approver.id = m.approved_by
  LEFT JOIN users manager ON manager.id = m.manager_approved_by`;

const list = async (filters = {}, db = pool) => {
  let sql = `${baseSelect} WHERE 1=1`;
  const params = [];
  if (filters.movement_type) { sql += " AND m.movement_type = ?"; params.push(filters.movement_type); }
  if (filters.product_id) { sql += " AND m.product_id = ?"; params.push(filters.product_id); }
  if (filters.status) { sql += " AND m.status = ?"; params.push(filters.status); }
  sql += " ORDER BY m.movement_date DESC, m.created_at DESC";
  const [rows] = await db.query(sql, params); return rows;
};
const findById = async (id, db = pool) => { const [rows] = await db.query(`${baseSelect} WHERE m.id = ?`, [id]); return rows[0] || null; };
const create = async (data, db = pool) => { const [r] = await db.query(`INSERT INTO input_movements (product_id, movement_type, quantity_pieces, total_weight_quintal, movement_date, description, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [data.product_id, data.movement_type, data.quantity_pieces, data.total_weight_quintal, data.movement_date, data.description || null, data.status, data.created_by]); return r.insertId; };
const update = async (id, data, db = pool) => { const allowed = ["status", "approved_by", "approved_at", "manager_approved_by", "manager_approved_at", "rejection_reason"]; const fields = []; const values = []; for (const key of allowed) if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); } if (!fields.length) return; values.push(id); await db.query(`UPDATE input_movements SET ${fields.join(", ")} WHERE id = ?`, values); };
const sum = async (productId, movementType, status = "manager_approved", db = pool) => { const [rows] = await db.query("SELECT COALESCE(SUM(quantity_pieces), 0) AS pieces, COALESCE(SUM(total_weight_quintal), 0) AS quintals FROM input_movements WHERE product_id = ? AND movement_type = ? AND status = ?", [productId, movementType, status]); return { pieces: Number(rows[0].pieces), quintals: Number(rows[0].quintals) }; };

module.exports = { list, findById, create, update, sum };

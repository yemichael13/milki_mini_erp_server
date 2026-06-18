const pool = require("../config/db");
const { RECORD_TYPES } = require("../constants/productionInventory");

const allowedTypes = new Set(Object.keys(RECORD_TYPES));
const getMeta = (typeKey) => {
  const meta = RECORD_TYPES[typeKey];
  if (!meta) {
    const err = new Error(`Unknown inventory record type: ${typeKey}`);
    err.statusCode = 500;
    throw err;
  }
  return meta;
};

const getDb = (db = pool) => db;

const buildSelect = (typeKey) => {
  const meta = getMeta(typeKey);
  return `
    SELECT r.*,
           p.product_type,
           p.package_size_kg,
           p.package_label,
           creator.full_name AS created_by_name,
           creator.email AS created_by_email,
           production_approver.full_name AS approved_by_name,
           production_approver.email AS approved_by_email,
           manager_approver.full_name AS manager_approved_by_name,
           manager_approver.email AS manager_approved_by_email
    FROM ${meta.table} r
    JOIN products p ON r.product_id = p.id
    LEFT JOIN users creator ON r.created_by = creator.id
    LEFT JOIN users production_approver ON r.approved_by = production_approver.id
    LEFT JOIN users manager_approver ON r.manager_approved_by = manager_approver.id
  `;
};

const listRecords = async (typeKey, filters = {}, db = pool) => {
  if (!allowedTypes.has(typeKey)) {
    const err = new Error(`Unknown inventory record type: ${typeKey}`);
    err.statusCode = 400;
    throw err;
  }
  const meta = getMeta(typeKey);
  let sql = `${buildSelect(typeKey)} WHERE 1=1`;
  const params = [];

  if (filters.id) {
    sql += " AND r.id = ?";
    params.push(filters.id);
  }
  if (filters.product_id) {
    sql += " AND r.product_id = ?";
    params.push(filters.product_id);
  }
  if (filters.product_type) {
    sql += " AND p.product_type = ?";
    params.push(filters.product_type);
  }
  if (filters.package_size_kg) {
    sql += " AND p.package_size_kg = ?";
    params.push(filters.package_size_kg);
  }
  if (filters.package_label) {
    sql += " AND p.package_label = ?";
    params.push(filters.package_label);
  }
  if (filters.status) {
    sql += " AND r.status = ?";
    params.push(filters.status);
  }
  if (filters.created_by) {
    sql += " AND r.created_by = ?";
    params.push(filters.created_by);
  }
  if (filters.creator) {
    sql += " AND (creator.full_name LIKE ? OR creator.email LIKE ?)";
    const value = `%${filters.creator}%`;
    params.push(value, value);
  }
  if (filters.approver) {
    sql += " AND (production_approver.full_name LIKE ? OR production_approver.email LIKE ? OR manager_approver.full_name LIKE ? OR manager_approver.email LIKE ?)";
    const value = `%${filters.approver}%`;
    params.push(value, value, value, value);
  }
  if (filters.from_date) {
    sql += ` AND DATE(r.${meta.dateField}) >= ?`;
    params.push(filters.from_date);
  }
  if (filters.to_date) {
    sql += ` AND DATE(r.${meta.dateField}) <= ?`;
    params.push(filters.to_date);
  }

  sql += ` ORDER BY r.${meta.dateField} DESC, r.created_at DESC`;
  const [rows] = await getDb(db).query(sql, params);
  return rows;
};

const findRecordById = async (typeKey, id, db = pool) => {
  const rows = await listRecords(typeKey, { id }, db);
  return rows[0] || null;
};

const createRecord = async (typeKey, data, db = pool) => {
  const meta = getMeta(typeKey);
  const [result] = await getDb(db).query(
    `INSERT INTO ${meta.table}
      (product_id, quantity_pieces, total_weight_quintal, ${meta.dateField}, description, status, created_by, approved_by, approved_at, manager_approved_by, manager_approved_at, rejection_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.product_id,
      data.quantity_pieces,
      data.total_weight_quintal,
      data[meta.dateField],
      data.description || null,
      data.status,
      data.created_by,
      data.approved_by || null,
      data.approved_at || null,
      data.manager_approved_by || null,
      data.manager_approved_at || null,
      data.rejection_reason || null,
    ]
  );
  return result.insertId;
};

const updateRecord = async (typeKey, id, updates, db = pool) => {
  const meta = getMeta(typeKey);
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
  if (!entries.length) return 0;

  const sql = entries.map(([field]) => `${field} = ?`).join(", ");
  const values = entries.map(([, value]) => value);
  values.push(id);

  const [result] = await getDb(db).query(
    `UPDATE ${meta.table}
     SET ${sql},
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    values
  );
  return result.affectedRows;
};

const countByStatus = async (typeKey, statuses, db = pool) => {
  const meta = getMeta(typeKey);
  const statusList = Array.isArray(statuses) ? statuses : [statuses];
  const placeholders = statusList.map(() => "?").join(", ");
  const [rows] = await getDb(db).query(
    `SELECT COUNT(*) AS count
     FROM ${meta.table}
     WHERE status IN (${placeholders})`,
    statusList
  );
  return Number(rows[0]?.count || 0);
};

const sumByStatus = async (typeKey, statuses, options = {}, db = pool) => {
  const meta = getMeta(typeKey);
  const statusList = Array.isArray(statuses) ? statuses : [statuses];
  const placeholders = statusList.map(() => "?").join(", ");
  const conditions = [`status IN (${placeholders})`];
  const params = [...statusList];

  if (options.product_id) {
    conditions.push("product_id = ?");
    params.push(options.product_id);
  }

  const [rows] = await getDb(db).query(
    `SELECT
       COALESCE(SUM(quantity_pieces), 0) AS quantity_pieces,
       COALESCE(SUM(total_weight_quintal), 0) AS total_weight_quintal
     FROM ${meta.table}
     WHERE ${conditions.join(" AND ")}`,
    params
  );
  return {
    quantity_pieces: Number(rows[0]?.quantity_pieces || 0),
    total_weight_quintal: Number(rows[0]?.total_weight_quintal || 0),
  };
};

const sumByProductAndStatus = async (typeKey, statuses, options = {}, db = pool) => {
  const meta = getMeta(typeKey);
  const statusList = Array.isArray(statuses) ? statuses : [statuses];
  const placeholders = statusList.map(() => "?").join(", ");
  const conditions = [`status IN (${placeholders})`];
  const params = [...statusList];

  if (options.product_id) {
    conditions.push("product_id = ?");
    params.push(options.product_id);
  }

  const [rows] = await getDb(db).query(
    `SELECT
       product_id,
       COALESCE(SUM(quantity_pieces), 0) AS quantity_pieces,
       COALESCE(SUM(total_weight_quintal), 0) AS total_weight_quintal
     FROM ${meta.table}
     WHERE ${conditions.join(" AND ")}
     GROUP BY product_id`,
    params
  );
  return rows;
};

const listAllByType = async (typeKey, filters = {}, db = pool) => {
  return listRecords(typeKey, filters, db);
};

module.exports = {
  listRecords,
  listAllByType,
  findRecordById,
  createRecord,
  updateRecord,
  countByStatus,
  sumByStatus,
  sumByProductAndStatus,
};

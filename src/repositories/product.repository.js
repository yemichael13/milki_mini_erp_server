const pool = require("../config/db");

const listAll = async (filters = {}, db = pool) => {
  let sql = `
    SELECT *
    FROM products
    WHERE 1=1
  `;
  const params = [];

  if (filters.id) {
    sql += " AND id = ?";
    params.push(filters.id);
  }
  if (filters.product_type) {
    sql += " AND product_type = ?";
    params.push(filters.product_type);
  }
  if (filters.package_size_kg) {
    sql += " AND package_size_kg = ?";
    params.push(filters.package_size_kg);
  }
  if (filters.package_label) {
    sql += " AND package_label = ?";
    params.push(filters.package_label);
  }
  if (filters.is_active !== undefined) {
    sql += " AND is_active = ?";
    params.push(filters.is_active ? 1 : 0);
  }

  sql += " ORDER BY product_type ASC, package_size_kg ASC";
  const [rows] = await db.query(sql, params);
  return rows;
};

const findById = async (id, db = pool) => {
  const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
  return rows[0] || null;
};

const findByTypeAndPackage = async (productType, packageSizeKg, db = pool) => {
  const [rows] = await db.query(
    `SELECT * FROM products
     WHERE product_type = ? AND package_size_kg = ?`,
    [productType, packageSizeKg]
  );
  return rows[0] || null;
};

const seedProducts = async (products, db = pool) => {
  if (!Array.isArray(products) || products.length === 0) return;
  for (const product of products) {
    await db.query(
      `INSERT INTO products (product_type, package_size_kg, package_label, is_active)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         package_label = VALUES(package_label),
         is_active = 1,
         updated_at = CURRENT_TIMESTAMP`,
      [product.product_type, product.package_size_kg, product.package_label]
    );
  }
};

module.exports = {
  listAll,
  findById,
  findByTypeAndPackage,
  seedProducts,
};

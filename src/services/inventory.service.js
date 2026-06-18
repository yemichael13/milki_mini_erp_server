const pool = require("../config/db");
const productRepository = require("../repositories/product.repository");
const inventoryRepository = require("../repositories/inventory.repository");
const { INVENTORY_STATUSES, RECORD_TYPES } = require("../constants/productionInventory");

const editableRoles = new Set(["production_recorder"]);
const productionApprovalRoles = new Set(["production_approver"]);
const managerRoles = new Set(["general_manager"]);
const readRoles = new Set([
  "production_recorder",
  "production_approver",
  "general_manager",
  "accountant",
  "system_admin",
]);

const getTypeMeta = (typeKey) => {
  const meta = RECORD_TYPES[typeKey];
  if (!meta) {
    const err = new Error(`Unknown inventory record type: ${typeKey}`);
    err.statusCode = 400;
    throw err;
  }
  return meta;
};

const ensureRole = (user, allowedRoles, message) => {
  if (!user || !allowedRoles.has(user.role)) {
    const err = new Error(message || "Forbidden");
    err.statusCode = 403;
    throw err;
  }
};

const toPositiveInt = (value, label) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const err = new Error(`${label} must be a positive whole number`);
    err.statusCode = 400;
    throw err;
  }
  return parsed;
};

const calculateWeightQuintal = (product, quantityPieces) => {
  const totalKg = quantityPieces * Number(product.package_size_kg);
  return Number((totalKg / 100).toFixed(2));
};

const getProductOrThrow = async (productId, db = pool) => {
  const product = await productRepository.findById(productId, db);
  if (!product || !product.is_active) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  return product;
};

const getInventorySnapshot = async (productId, db = pool) => {
  const [production, releases, returns] = await Promise.all([
    inventoryRepository.sumByStatus("production", INVENTORY_STATUSES.MANAGER_APPROVED, { product_id: productId }, db),
    inventoryRepository.sumByStatus("release", INVENTORY_STATUSES.MANAGER_APPROVED, { product_id: productId }, db),
    inventoryRepository.sumByStatus("return", INVENTORY_STATUSES.MANAGER_APPROVED, { product_id: productId }, db),
  ]);

  const totalPieces = production.quantity_pieces + returns.quantity_pieces - releases.quantity_pieces;
  const totalQuintals = Number(
    (production.total_weight_quintal + returns.total_weight_quintal - releases.total_weight_quintal).toFixed(2)
  );

  return {
    quantity_pieces: totalPieces,
    total_weight_quintal: totalQuintals,
    production,
    releases,
    returns,
  };
};

const assertReleaseCapacity = async (record, db = pool) => {
  const product = await getProductOrThrow(record.product_id, db);
  await db.query("SELECT id FROM products WHERE id = ? FOR UPDATE", [product.id]);
  const snapshot = await getInventorySnapshot(product.id, db);
  if (record.quantity_pieces > snapshot.quantity_pieces) {
    const err = new Error("Release quantity exceeds available inventory");
    err.statusCode = 400;
    throw err;
  }
  return { product, snapshot };
};

const listProducts = async (filters = {}) => {
  return productRepository.listAll(
    {
      product_type: filters.product_type,
      package_size_kg: filters.package_size_kg,
      package_label: filters.package_label,
      is_active: filters.is_active,
    }
  );
};

const listRecords = async (typeKey, user, filters = {}) => {
  ensureRole(user, readRoles, "Forbidden");
  const queryFilters = { ...filters };

  if (user.role === "production_recorder") {
    queryFilters.created_by = user.id;
  }

  return inventoryRepository.listRecords(typeKey, queryFilters);
};

const createRecord = async (typeKey, user, data) => {
  ensureRole(user, editableRoles, "Only production recorders can create inventory records");
  const meta = getTypeMeta(typeKey);
  const productId = toPositiveInt(data.product_id, "Product");
  const quantityPieces = toPositiveInt(data.quantity_pieces, "Quantity");
  const product = await getProductOrThrow(productId);
  const movementDate = data[meta.dateField];

  if (!movementDate) {
    const err = new Error(`${meta.dateField} is required`);
    err.statusCode = 400;
    throw err;
  }

  if (typeKey === "release") {
    const snapshot = await getInventorySnapshot(productId);
    if (quantityPieces > snapshot.quantity_pieces) {
      const err = new Error("Release quantity exceeds available inventory");
      err.statusCode = 400;
      throw err;
    }
  }

  if (typeKey === "return") {
    const productionDate = new Date(data.production_date);
    const releaseDate = new Date(data.release_date);
    const returnDate = new Date(data.return_date);
    if (productionDate > releaseDate || releaseDate > returnDate) {
      const err = new Error("Return dates must be in chronological order");
      err.statusCode = 400;
      throw err;
    }
  }

  const totalWeightQuintal = calculateWeightQuintal(product, quantityPieces);
  const id = await inventoryRepository.createRecord(typeKey, {
    product_id: productId,
    quantity_pieces: quantityPieces,
    total_weight_quintal: totalWeightQuintal,
    [meta.dateField]: movementDate,
    description: data.description || null,
    status: INVENTORY_STATUSES.PRODUCTION_PENDING,
    created_by: user.id,
    approved_by: null,
    approved_at: null,
    manager_approved_by: null,
    manager_approved_at: null,
    rejection_reason: null,
  });

  return inventoryRepository.findRecordById(typeKey, id);
};

const approveRecord = async (typeKey, user, id) => {
  ensureRole(user, productionApprovalRoles, "Only production approvers can approve inventory records");
  const record = await inventoryRepository.findRecordById(typeKey, id);
  if (!record) {
    const err = new Error("Record not found");
    err.statusCode = 404;
    throw err;
  }
  if (record.status !== INVENTORY_STATUSES.PRODUCTION_PENDING) {
    const err = new Error("Only production-pending records can be approved");
    err.statusCode = 400;
    throw err;
  }

  await inventoryRepository.updateRecord(
    typeKey,
    id,
    {
      approved_by: user.id,
      approved_at: new Date(),
      status: INVENTORY_STATUSES.MANAGER_PENDING,
      rejection_reason: null,
    }
  );

  return inventoryRepository.findRecordById(typeKey, id);
};

const managerApproveRecord = async (typeKey, user, id) => {
  ensureRole(user, managerRoles, "Only the general manager can complete inventory approvals");
  const record = await inventoryRepository.findRecordById(typeKey, id);
  if (!record) {
    const err = new Error("Record not found");
    err.statusCode = 404;
    throw err;
  }
  if (![INVENTORY_STATUSES.MANAGER_PENDING, INVENTORY_STATUSES.PRODUCTION_APPROVED].includes(record.status)) {
    const err = new Error("Only manager-pending or production-approved records can be manager-approved");
    err.statusCode = 400;
    throw err;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (typeKey === "release") {
      await assertReleaseCapacity(record, connection);
    }

    await inventoryRepository.updateRecord(
      typeKey,
      id,
      {
        manager_approved_by: user.id,
        manager_approved_at: new Date(),
        status: INVENTORY_STATUSES.MANAGER_APPROVED,
        rejection_reason: null,
      },
      connection
    );

    await connection.commit();
    return inventoryRepository.findRecordById(typeKey, id);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const rejectRecord = async (typeKey, user, id, reason = null) => {
  if (!productionApprovalRoles.has(user.role) && !managerRoles.has(user.role)) {
    const err = new Error("Only production approvers or the general manager can reject inventory records");
    err.statusCode = 403;
    throw err;
  }

  const record = await inventoryRepository.findRecordById(typeKey, id);
  if (!record) {
    const err = new Error("Record not found");
    err.statusCode = 404;
    throw err;
  }
  if (record.status === INVENTORY_STATUSES.MANAGER_APPROVED) {
    const err = new Error("Manager-approved records cannot be rejected");
    err.statusCode = 400;
    throw err;
  }

  await inventoryRepository.updateRecord(
    typeKey,
    id,
    {
      status: INVENTORY_STATUSES.REJECTED,
      rejection_reason: reason || null,
    }
  );

  return inventoryRepository.findRecordById(typeKey, id);
};

const getTotals = async () => {
  const [production, releases, returns, pendingProduction, pendingManager] = await Promise.all([
    inventoryRepository.sumByStatus("production", INVENTORY_STATUSES.MANAGER_APPROVED),
    inventoryRepository.sumByStatus("release", INVENTORY_STATUSES.MANAGER_APPROVED),
    inventoryRepository.sumByStatus("return", INVENTORY_STATUSES.MANAGER_APPROVED),
    Promise.all([
      inventoryRepository.countByStatus("production", INVENTORY_STATUSES.PRODUCTION_PENDING),
      inventoryRepository.countByStatus("release", INVENTORY_STATUSES.PRODUCTION_PENDING),
      inventoryRepository.countByStatus("return", INVENTORY_STATUSES.PRODUCTION_PENDING),
    ]),
    Promise.all([
      inventoryRepository.countByStatus("production", INVENTORY_STATUSES.MANAGER_PENDING),
      inventoryRepository.countByStatus("release", INVENTORY_STATUSES.MANAGER_PENDING),
      inventoryRepository.countByStatus("return", INVENTORY_STATUSES.MANAGER_PENDING),
      inventoryRepository.countByStatus("production", INVENTORY_STATUSES.PRODUCTION_APPROVED),
      inventoryRepository.countByStatus("release", INVENTORY_STATUSES.PRODUCTION_APPROVED),
      inventoryRepository.countByStatus("return", INVENTORY_STATUSES.PRODUCTION_APPROVED),
    ]),
  ]);

  const currentPieces = production.quantity_pieces + returns.quantity_pieces - releases.quantity_pieces;
  const currentQuintals = Number(
    (production.total_weight_quintal + returns.total_weight_quintal - releases.total_weight_quintal).toFixed(2)
  );

  return {
    total_produced_pieces: production.quantity_pieces,
    total_produced_quintals: production.total_weight_quintal,
    total_released_pieces: releases.quantity_pieces,
    total_released_quintals: releases.total_weight_quintal,
    total_returned_pieces: returns.quantity_pieces,
    total_returned_quintals: returns.total_weight_quintal,
    current_inventory_pieces: currentPieces,
    current_inventory_quintals: currentQuintals,
    pending_approvals: pendingProduction.reduce((sum, value) => sum + value, 0),
    pending_manager_reviews: pendingManager.reduce((sum, value) => sum + value, 0),
  };
};

const getProductSummaryRows = async (filters = {}) => {
  const [products, producedRows, releaseRows, returnRows] = await Promise.all([
    productRepository.listAll({
      is_active: true,
      product_type: filters.product_type,
      package_size_kg: filters.package_size_kg,
      package_label: filters.package_label,
    }),
    inventoryRepository.sumByProductAndStatus("production", INVENTORY_STATUSES.MANAGER_APPROVED),
    inventoryRepository.sumByProductAndStatus("release", INVENTORY_STATUSES.MANAGER_APPROVED),
    inventoryRepository.sumByProductAndStatus("return", INVENTORY_STATUSES.MANAGER_APPROVED),
  ]);

  const byProduct = new Map();
  for (const product of products) {
    byProduct.set(product.id, {
      product_id: product.id,
      product_type: product.product_type,
      package_size_kg: Number(product.package_size_kg),
      package_label: product.package_label,
      produced_pieces: 0,
      produced_quintals: 0,
      released_pieces: 0,
      released_quintals: 0,
      returned_pieces: 0,
      returned_quintals: 0,
      current_balance_pieces: 0,
      current_balance_quintals: 0,
    });
  }

  const applyRows = (rows, pieceField, quintalField) => {
    for (const row of rows) {
      if (!byProduct.has(row.product_id)) continue;
      const current = byProduct.get(row.product_id);
      current[pieceField] = Number(row.quantity_pieces || 0);
      current[quintalField] = Number(row.total_weight_quintal || 0);
    }
  };

  applyRows(producedRows, "produced_pieces", "produced_quintals");
  applyRows(releaseRows, "released_pieces", "released_quintals");
  applyRows(returnRows, "returned_pieces", "returned_quintals");

  for (const row of byProduct.values()) {
    row.current_balance_pieces = row.produced_pieces + row.returned_pieces - row.released_pieces;
    row.current_balance_quintals = Number(
      (row.produced_quintals + row.returned_quintals - row.released_quintals).toFixed(2)
    );
  }

  return Array.from(byProduct.values());
};

const getMovementHistory = async (filters = {}) => {
  const [productions, releases, returns] = await Promise.all([
    inventoryRepository.listRecords("production", filters),
    inventoryRepository.listRecords("release", filters),
    inventoryRepository.listRecords("return", filters),
  ]);

  const mapRecord = (record, movementType, dateField) => ({
    movement_type: movementType,
    record_id: record.id,
    product_id: record.product_id,
    product_type: record.product_type,
    package_size_kg: Number(record.package_size_kg),
    package_label: record.package_label,
    quantity_pieces: Number(record.quantity_pieces),
    total_weight_quintal: Number(record.total_weight_quintal),
    movement_date: record[dateField],
    status: record.status,
    created_by_name: record.created_by_name,
    approved_by_name: record.approved_by_name,
    manager_approved_by_name: record.manager_approved_by_name,
    description: record.description,
    rejection_reason: record.rejection_reason,
  });

  const mapped = [
    ...productions.map((record) => mapRecord(record, "production", "production_date")),
    ...releases.map((record) => mapRecord(record, "release", "release_date")),
    ...returns.map((record) => mapRecord(record, "return", "return_date")),
  ];

  mapped.sort((a, b) => {
    const left = new Date(a.movement_date).getTime();
    const right = new Date(b.movement_date).getTime();
    return right - left;
  });

  return mapped;
};

const getDashboard = async () => {
  const totals = await getTotals();
  const products = await getProductSummaryRows();
  return {
    ...totals,
    products,
  };
};

const getReports = async (filters = {}) => {
  const [summary, movementHistory] = await Promise.all([
    getProductSummaryRows(filters),
    getMovementHistory(filters),
  ]);

  return {
    product_inventory_summary: summary,
    store_balance_report: summary,
    movement_history: movementHistory,
  };
};

module.exports = {
  listProducts,
  listRecords,
  createRecord,
  approveRecord,
  managerApproveRecord,
  rejectRecord,
  getDashboard,
  getReports,
  getInventorySnapshot,
};

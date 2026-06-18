const inventoryService = require("../services/inventory.service");
const logger = require("../config/logger");

const readFilters = (req) => ({
  product_type: req.query.product_type,
  package_size_kg: req.query.package_size_kg,
  package_label: req.query.package_label,
  product_id: req.query.product_id,
  status: req.query.status,
  created_by: req.query.created_by,
  creator: req.query.creator,
  approver: req.query.approver,
  from_date: req.query.from_date,
  to_date: req.query.to_date,
  is_active: req.query.is_active,
});

const listProducts = async (req, res, next) => {
  try {
    const rows = await inventoryService.listProducts(readFilters(req));
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const listRecords = (typeKey) => async (req, res, next) => {
  try {
    const rows = await inventoryService.listRecords(typeKey, req.user, readFilters(req));
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const createRecord = (typeKey) => async (req, res, next) => {
  try {
    const record = await inventoryService.createRecord(typeKey, req.user, req.body);
    logger.info({
      message: `${typeKey} inventory record created`,
      recordType: typeKey,
      recordId: record.id,
      userId: req.user.id,
    });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
};

const approveRecord = (typeKey) => async (req, res, next) => {
  try {
    const record = await inventoryService.approveRecord(typeKey, req.user, Number(req.params.id));
    logger.info({
      message: `${typeKey} inventory record approved`,
      recordType: typeKey,
      recordId: record.id,
      userId: req.user.id,
    });
    res.json(record);
  } catch (err) {
    next(err);
  }
};

const managerApproveRecord = (typeKey) => async (req, res, next) => {
  try {
    const record = await inventoryService.managerApproveRecord(typeKey, req.user, Number(req.params.id));
    logger.info({
      message: `${typeKey} inventory record manager-approved`,
      recordType: typeKey,
      recordId: record.id,
      userId: req.user.id,
    });
    res.json(record);
  } catch (err) {
    next(err);
  }
};

const rejectRecord = (typeKey) => async (req, res, next) => {
  try {
    const record = await inventoryService.rejectRecord(
      typeKey,
      req.user,
      Number(req.params.id),
      req.body.rejection_reason
    );
    logger.info({
      message: `${typeKey} inventory record rejected`,
      recordType: typeKey,
      recordId: record.id,
      userId: req.user.id,
    });
    res.json(record);
  } catch (err) {
    next(err);
  }
};

const getInventory = async (req, res, next) => {
  try {
    const data = await inventoryService.getDashboard();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getReports = async (req, res, next) => {
  try {
    const data = await inventoryService.getReports(readFilters(req));
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProducts,
  listRecords,
  createRecord,
  approveRecord,
  managerApproveRecord,
  rejectRecord,
  getInventory,
  getReports,
};

const path = require("path");
const transactionService = require("../services/transaction.service");
const logger = require("../config/logger");

const list = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.type) filters.type = req.query.type;
    if (req.query.source_department) filters.source_department = req.query.source_department;
    if (req.query.customer_id) filters.customer_id = Number(req.query.customer_id);
    if (req.query.supplier_id) filters.supplier_id = Number(req.query.supplier_id);
    if (req.query.from_date) filters.from_date = req.query.from_date;
    if (req.query.to_date) filters.to_date = req.query.to_date;

    if (req.user.role === "system_admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Role-based filtering: officers can see only their own transactions
    if (["sales", "procurement", "production"].includes(req.user.role)) {
      filters.source_department = req.user.role;
      filters.created_by = req.user.id;
    }
    // accountant and general_manager can see all

    const list = await transactionService.list(filters);
    res.json(list);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    if (req.user.role === "system_admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const tx = await transactionService.getById(Number(req.params.id));
    if (["sales", "procurement", "production"].includes(req.user.role)) {
      if (tx.created_by !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.receipt_image = path.posix.join("uploads", "receipts", req.file.filename);
    }

    const tx = await transactionService.create(data, req.user);
    logger.info({
      message: `Transaction created`,
      transactionId: tx.id,
      userId: req.user.id,
      type: tx.type,
      sourceDepartment: tx.source_department,
    });
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
};

const uploadReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error("No receipt file uploaded");
      err.statusCode = 400;
      return next(err);
    }
    const receiptPath = path.posix.join("uploads", "receipts", req.file.filename);
    const tx = await transactionService.uploadReceipt(
      Number(req.params.id),
      receiptPath,
      req.user
    );
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const managerApprove = async (req, res, next) => {
  try {
    const tx = await transactionService.managerApprove(
      Number(req.params.id),
      req.user.id
    );
    logger.info({
      message: `Transaction manager approved`,
      transactionId: tx.id,
      userId: req.user.id,
    });
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const reject = async (req, res, next) => {
  try {
    const tx = await transactionService.reject(
      Number(req.params.id),
      req.user.id,
      req.body.rejection_reason
    );
    logger.info({
      message: `Transaction rejected`,
      transactionId: tx.id,
      userId: req.user.id,
    });
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getById,
  create,
  uploadReceipt,
  managerApprove,
  reject,
};

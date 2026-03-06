const salesService = require("../services/sales.service");

const listMine = async (req, res, next) => {
  try {
    const rows = await salesService.listMine(req.user.id, req.query.status);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const listAll = async (req, res, next) => {
  try {
    const rows = await salesService.listAll(req.query.status);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const tx = await salesService.getById(Number(req.params.id));
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error("Receipt image is required");
      err.statusCode = 400;
      throw err;
    }
    const receiptUrl = req.file.path;
    const tx = await salesService.create(req.user, req.body, receiptUrl);
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
      throw err;
    }
    const receiptUrl = req.file.path;
    const tx = await salesService.uploadReceipt(req.user, Number(req.params.id), receiptUrl);
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const resubmit = async (req, res, next) => {
  try {
    const tx = await salesService.resubmit(req.user, Number(req.params.id), req.body);
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const accountantApprove = async (req, res, next) => {
  try {
    const description = req.body.description;
    const receiptUrl = req.file?.path || null;
    const tx = await salesService.accountantApprove(req.user, Number(req.params.id), description, receiptUrl);
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const managerApprove = async (req, res, next) => {
  try {
    const description = req.body.description;
    const receiptUrl = req.file?.path || null;
    const tx = await salesService.managerApprove(req.user, Number(req.params.id), description, receiptUrl);
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const reject = async (req, res, next) => {
  try {
    const reason = req.body.description; // description field used as rejection reason
    const receiptUrl = req.file?.path || null;
    const tx = await salesService.reject(req.user, Number(req.params.id), reason, receiptUrl);
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listMine,
  listAll,
  getById,
  create,
  uploadReceipt,
  resubmit,
  accountantApprove,
  managerApprove,
  reject,
};


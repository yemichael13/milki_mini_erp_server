const procurementService = require("../services/procurement.service");

const listMine = async (req, res, next) => {
  try {
    const rows = await procurementService.listMine(req.user.id, req.query.status);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const listAll = async (req, res, next) => {
  try {
    const rows = await procurementService.listAll(req.query.status);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const tx = await procurementService.getById(Number(req.params.id));
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const receiptUrl = req.file?.path || null;
    const tx = await procurementService.create(req.user, req.body, receiptUrl);
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
    const tx = await procurementService.uploadReceipt(req.user, Number(req.params.id), receiptUrl);
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const resubmit = async (req, res, next) => {
  try {
    const tx = await procurementService.resubmit(req.user, Number(req.params.id), req.body);
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const accountantApprove = async (req, res, next) => {
  try {
    const tx = await procurementService.accountantApprove(req.user, Number(req.params.id));
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const managerApprove = async (req, res, next) => {
  try {
    const tx = await procurementService.managerApprove(req.user, Number(req.params.id));
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

const reject = async (req, res, next) => {
  try {
    const tx = await procurementService.reject(
      req.user,
      Number(req.params.id),
      req.body.rejection_reason
    );
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


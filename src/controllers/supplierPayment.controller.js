const supplierPaymentService = require("../services/supplierPayment.service");

const list = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    if (filters.supplier_id) filters.supplier_id = Number(filters.supplier_id);
    const rows = await supplierPaymentService.list(filters);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const receiptUrl = req.file?.path || null;
    const row = await supplierPaymentService.create(req.user, req.body, receiptUrl);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create };


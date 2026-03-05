const customerPaymentService = require("../services/customerPayment.service");

const list = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    if (filters.customer_id) filters.customer_id = Number(filters.customer_id);
    const rows = await customerPaymentService.list(filters);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const receiptUrl = req.file?.path || null;
    const row = await customerPaymentService.create(req.user, req.body, receiptUrl);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create };


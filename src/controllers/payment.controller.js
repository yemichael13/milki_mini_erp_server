const paymentService = require("../services/payment.service");

const list = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.customer_id) filters.customer_id = Number(req.query.customer_id);
    if (req.query.from_date) filters.from_date = req.query.from_date;
    if (req.query.to_date) filters.to_date = req.query.to_date;
    const payments = await paymentService.list(filters);
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const payment = await paymentService.getById(Number(req.params.id));
    res.json(payment);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.receipt_path = req.file.path || req.file.filename;
    const payment = await paymentService.create(data, req.user.id);
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create };

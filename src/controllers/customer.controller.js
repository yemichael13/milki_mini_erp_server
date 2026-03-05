const customerService = require("../services/customer.service");

const list = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const customers = await customerService.list(search);
    res.json(customers);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const includeCredit = req.query.credit === "true";
    const customer = await customerService.getById(Number(req.params.id), includeCredit);
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const customer = await customerService.create(req.body, req.user.id);
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create };

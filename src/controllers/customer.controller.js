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
    const customer = await customerService.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const customer = await customerService.update(Number(req.params.id), req.body);
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await customerService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, remove };

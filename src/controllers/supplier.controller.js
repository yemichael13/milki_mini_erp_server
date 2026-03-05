const supplierService = require("../services/supplier.service");

const list = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const suppliers = await supplierService.list(search);
    res.json(suppliers);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const includeDebt = req.query.debt === "true";
    const supplier = await supplierService.getById(Number(req.params.id), includeDebt);
    res.json(supplier);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const supplier = await supplierService.create(req.body, req.user.id);
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create };


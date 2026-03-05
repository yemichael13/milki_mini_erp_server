const supplierRepository = require("../repositories/supplier.repository");
const creditDebtService = require("./creditDebt.service");

const list = async (search) => {
  return supplierRepository.findAll(search);
};

const getById = async (id, includeDebt = false) => {
  const supplier = await supplierRepository.findById(id);
  if (!supplier) {
    const err = new Error("Supplier not found");
    err.statusCode = 404;
    throw err;
  }
  if (includeDebt) {
    supplier.debt_balance = await creditDebtService.getSupplierDebt(id);
  }
  return supplier;
};

const create = async (data, createdBy) => {
  const id = await supplierRepository.create(data, createdBy);
  return supplierRepository.findById(id);
};

module.exports = { list, getById, create };


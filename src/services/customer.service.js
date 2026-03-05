const customerRepository = require("../repositories/customer.repository");
const creditDebtService = require("./creditDebt.service");

const list = async (search) => {
  return customerRepository.findAll(search);
};

const getById = async (id, includeCredit = false) => {
  const customer = await customerRepository.findById(id);
  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  if (includeCredit) {
    customer.credit_balance = await creditDebtService.getCustomerCredit(id);
  }
  return customer;
};

const create = async (data, createdBy) => {
  const id = await customerRepository.create(data, createdBy);
  return customerRepository.findById(id);
};

module.exports = { list, getById, create };

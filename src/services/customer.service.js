const customerRepository = require("../repositories/customer.repository");
const calculateCredit = require("../utils/creditCalculator");

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
    customer.credit_balance = await calculateCredit(id);
  }
  return customer;
};

const create = async (data) => {
  const id = await customerRepository.create(data);
  return customerRepository.findById(id);
};

const update = async (id, data) => {
  await getById(id);
  await customerRepository.update(id, data);
  return customerRepository.findById(id);
};

const remove = async (id) => {
  await getById(id);
  return customerRepository.deleteById(id);
};

module.exports = { list, getById, create, update, remove };

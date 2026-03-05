const customerRepo = require("../repositories/customer.repository");
const customerPaymentRepo = require("../repositories/customerPayment.repository");

const list = async (filters) => {
  return customerPaymentRepo.list(filters);
};

const create = async (user, data, receiptUrl) => {
  if (user.role !== "accountant") {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  const customer = await customerRepo.findById(data.customer_id);
  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  const id = await customerPaymentRepo.create({
    ...data,
    receipt_url: receiptUrl || null,
    recorded_by: user.id,
  });
  return customerPaymentRepo.findById(id);
};

module.exports = { list, create };


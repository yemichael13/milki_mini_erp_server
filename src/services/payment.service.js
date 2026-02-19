const paymentRepository = require("../repositories/payment.repository");
const customerRepository = require("../repositories/customer.repository");
const logger = require("../config/logger");

const list = async (filters) => {
  return paymentRepository.findAll(filters);
};

const getById = async (id) => {
  const payment = await paymentRepository.findById(id);
  if (!payment) {
    const err = new Error("Payment not found");
    err.statusCode = 404;
    throw err;
  }
  return payment;
};

const create = async (data, userId) => {
  const customer = await customerRepository.findById(data.customer_id);
  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  const id = await paymentRepository.create({
    customer_id: data.customer_id,
    amount: data.amount,
    payment_date: data.payment_date,
    reference: data.reference,
    receipt_path: data.receipt_path,
    recorded_by: userId,
  });
  const payment = await paymentRepository.findById(id);
  logger.info({
    message: "Payment recorded",
    paymentId: id,
    customerId: data.customer_id,
    amount: data.amount,
    userId,
  });
  return payment;
};

module.exports = { list, getById, create };

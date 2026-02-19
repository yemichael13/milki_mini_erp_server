const transactionRepository = require("../repositories/transaction.repository");
const customerRepository = require("../repositories/customer.repository");

const WORKFLOW = transactionRepository.WORKFLOW;
const STATUS = transactionRepository.STATUS;

const list = async (workflow, filters) => {
  const merged = { ...filters, workflow };
  return transactionRepository.findAll(merged);
};

const getById = async (id, workflow = null) => {
  const tx = await transactionRepository.findById(id);
  if (!tx) {
    const err = new Error("Transaction not found");
    err.statusCode = 404;
    throw err;
  }
  if (workflow && tx.workflow !== workflow) {
    const err = new Error("Transaction not found");
    err.statusCode = 404;
    throw err;
  }
  return tx;
};

const create = async (workflow, data, userId) => {
  const customer = await customerRepository.findById(data.customer_id);
  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  const id = await transactionRepository.create({
    customer_id: data.customer_id,
    workflow,
    total_amount: data.total_amount,
    description: data.description,
    receipt_path: data.receipt_path,
    created_by: userId,
  });
  return transactionRepository.findById(id);
};

const uploadReceipt = async (id, workflow, receiptPath, userId) => {
  const tx = await getById(id, workflow);
  if (tx.status !== "pending") {
    const err = new Error("Only pending transactions can receive receipt uploads");
    err.statusCode = 400;
    throw err;
  }
  await transactionRepository.updateReceipt(id, receiptPath);
  return transactionRepository.findById(id);
};

const accountantApprove = async (id, workflow, userId) => {
  const tx = await getById(id, workflow);
  if (tx.status !== "pending") {
    const err = new Error("Only pending transactions can be approved by accountant");
    err.statusCode = 400;
    throw err;
  }
  await transactionRepository.updateStatus(id, "accountant_approved", userId);
  return transactionRepository.findById(id);
};

const managerApprove = async (id, workflow, userId) => {
  const tx = await getById(id, workflow);
  if (tx.status !== "accountant_approved") {
    const err = new Error("Only accountant-approved transactions can be approved by manager");
    err.statusCode = 400;
    throw err;
  }
  await transactionRepository.updateStatus(id, "manager_approved", userId);
  return transactionRepository.findById(id);
};

const reject = async (id, workflow, userId, rejectionReason = null) => {
  const tx = await getById(id, workflow);
  if (tx.status === "manager_approved" || tx.status === "rejected") {
    const err = new Error("Transaction cannot be rejected in current state");
    err.statusCode = 400;
    throw err;
  }
  await transactionRepository.updateStatus(id, "rejected", userId, rejectionReason);
  return transactionRepository.findById(id);
};

module.exports = {
  WORKFLOW,
  STATUS,
  list,
  getById,
  create,
  uploadReceipt,
  accountantApprove,
  managerApprove,
  reject,
};

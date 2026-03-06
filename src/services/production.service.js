const productionTxRepo = require("../repositories/productionTransaction.repository");

const listMine = async (userId, status) => {
  return productionTxRepo.listMine(userId, status || null);
};

const listAll = async (status) => {
  return productionTxRepo.listAll(status || null);
};

const getById = async (id) => {
  const tx = await productionTxRepo.findById(id);
  if (!tx) {
    const err = new Error("Production transaction not found");
    err.statusCode = 404;
    throw err;
  }
  return tx;
};

const create = async (user, data, receiptUrl) => {
  if (user.role !== "production_officer") {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  const id = await productionTxRepo.create({
    ...data,
    receipt_url: receiptUrl || null,
    created_by: user.id,
  });
  return productionTxRepo.findById(id);
};

const uploadReceipt = async (user, id, receiptUrl) => {
  const tx = await getById(id);
  if (user.role !== "production_officer" || tx.created_by !== user.id) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  if (!["pending", "rejected"].includes(tx.status)) {
    const err = new Error("Receipt can only be uploaded for pending/rejected transactions");
    err.statusCode = 400;
    throw err;
  }
  await productionTxRepo.updateReceipt(id, receiptUrl);
  return productionTxRepo.findById(id);
};

const resubmit = async (user, id, data) => {
  const tx = await getById(id);
  if (user.role !== "production_officer" || tx.created_by !== user.id) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  if (tx.status !== "rejected") {
    const err = new Error("Only rejected transactions can be resubmitted");
    err.statusCode = 400;
    throw err;
  }
  await productionTxRepo.resubmit(id, data);
  return productionTxRepo.findById(id);
};

const accountantApprove = async (user, id, description, receiptUrl) => {
  if (user.role !== "accountant") {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  const tx = await getById(id);
  if (tx.status !== "pending") {
    const err = new Error("Only pending transactions can be accountant-approved");
    err.statusCode = 400;
    throw err;
  }
  await productionTxRepo.setAccountantApproved(id, user.id, description, receiptUrl);
  return productionTxRepo.findById(id);
};

const managerApprove = async (user, id, description, receiptUrl) => {
  if (user.role !== "general_manager") {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  const tx = await getById(id);
  if (tx.status !== "accountant_approved") {
    const err = new Error("Only accountant-approved transactions can be manager-approved");
    err.statusCode = 400;
    throw err;
  }
  await productionTxRepo.setManagerApproved(id, user.id, description, receiptUrl);
  return productionTxRepo.findById(id);
};

const reject = async (user, id, reason, receiptUrl) => {
  if (!["accountant", "general_manager"].includes(user.role)) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  const tx = await getById(id);
  if (tx.status === "manager_approved") {
    const err = new Error("Manager-approved transactions cannot be rejected");
    err.statusCode = 400;
    throw err;
  }
  await productionTxRepo.setRejected(id, user.id, reason, receiptUrl);
  return productionTxRepo.findById(id);
};

module.exports = {
  listMine,
  listAll,
  getById,
  create,
  uploadReceipt,
  resubmit,
  accountantApprove,
  managerApprove,
  reject,
};


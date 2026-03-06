const procurementTxRepo = require("../repositories/procurementTransaction.repository");
const supplierRepo = require("../repositories/supplier.repository");

const listMine = async (userId, status) => {
  return procurementTxRepo.listMine(userId, status || null);
};

const listAll = async (status) => {
  return procurementTxRepo.listAll(status || null);
};

const getById = async (id) => {
  const tx = await procurementTxRepo.findById(id);
  if (!tx) {
    const err = new Error("Procurement transaction not found");
    err.statusCode = 404;
    throw err;
  }
  return tx;
};

const create = async (user, data, receiptUrl) => {
  if (user.role !== "procurement_officer") {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  const supplier = await supplierRepo.findById(data.supplier_id);
  if (!supplier) {
    const err = new Error("Supplier not found");
    err.statusCode = 404;
    throw err;
  }
  const id = await procurementTxRepo.create({
    ...data,
    receipt_url: receiptUrl || null,
    created_by: user.id,
  });
  return procurementTxRepo.findById(id);
};

const uploadReceipt = async (user, id, receiptUrl) => {
  const tx = await getById(id);
  if (user.role !== "procurement_officer" || tx.created_by !== user.id) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  if (!["pending", "rejected"].includes(tx.status)) {
    const err = new Error("Receipt can only be uploaded for pending/rejected transactions");
    err.statusCode = 400;
    throw err;
  }
  await procurementTxRepo.updateReceipt(id, receiptUrl);
  return procurementTxRepo.findById(id);
};

const resubmit = async (user, id, data) => {
  const tx = await getById(id);
  if (user.role !== "procurement_officer" || tx.created_by !== user.id) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  if (tx.status !== "rejected") {
    const err = new Error("Only rejected transactions can be resubmitted");
    err.statusCode = 400;
    throw err;
  }
  const supplier = await supplierRepo.findById(data.supplier_id);
  if (!supplier) {
    const err = new Error("Supplier not found");
    err.statusCode = 404;
    throw err;
  }
  await procurementTxRepo.resubmit(id, data);
  return procurementTxRepo.findById(id);
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
  await procurementTxRepo.setAccountantApproved(id, user.id, description, receiptUrl);
  return procurementTxRepo.findById(id);
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
  await procurementTxRepo.setManagerApproved(id, user.id, description, receiptUrl);
  return procurementTxRepo.findById(id);
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
  await procurementTxRepo.setRejected(id, user.id, reason, receiptUrl);
  return procurementTxRepo.findById(id);
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


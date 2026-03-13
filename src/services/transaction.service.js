const transactionRepository = require("../repositories/transaction.repository");
const customerRepository = require("../repositories/customer.repository");
const supplierRepository = require("../repositories/supplier.repository");

const TYPES = transactionRepository.TYPES;
const SOURCE_DEPARTMENTS = transactionRepository.SOURCE_DEPARTMENTS;
const PAYMENT_TYPES = transactionRepository.PAYMENT_TYPES;
const STATUS = transactionRepository.STATUS;

const list = async (filters = {}) => {
  return transactionRepository.findAll(filters);
};

const getById = async (id) => {
  const tx = await transactionRepository.findById(id);
  if (!tx) {
    const err = new Error("Transaction not found");
    err.statusCode = 404;
    throw err;
  }
  return tx;
};

const departmentConfig = {
  sales: {
    type: "sale",
    paymentTypes: ["paid", "credit"],
    requiredField: "customer_id",
  },
  procurement: {
    type: "procurement",
    paymentTypes: ["paid", "debt"],
    requiredField: "supplier_id",
  },
  production: {
    type: "production",
    paymentTypes: ["paid"],
    requiredField: null,
  },
};

const create = async (data, user) => {
  const role = user?.role;
  const config = departmentConfig[role];
  if (!config) {
    const err = new Error("Only department officers can create transactions");
    err.statusCode = 403;
    throw err;
  }

  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    const err = new Error("Amount must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  const paymentType = data.payment_type || (role === "production" ? "paid" : null);
  if (!paymentType || !config.paymentTypes.includes(paymentType)) {
    const err = new Error(`Invalid payment type for ${role} transactions`);
    err.statusCode = 400;
    throw err;
  }

  let customerId = null;
  let supplierId = null;

  if (config.requiredField === "customer_id") {
    customerId = Number(data.customer_id);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      const err = new Error("Customer is required");
      err.statusCode = 400;
      throw err;
    }
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      const err = new Error("Customer not found");
      err.statusCode = 404;
      throw err;
    }
  }

  if (config.requiredField === "supplier_id") {
    supplierId = Number(data.supplier_id);
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      const err = new Error("Supplier is required");
      err.statusCode = 400;
      throw err;
    }
    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) {
      const err = new Error("Supplier not found");
      err.statusCode = 404;
      throw err;
    }
  }

  const id = await transactionRepository.create({
    type: config.type,
    source_department: role,
    amount,
    payment_type: paymentType,
    customer_id: customerId,
    supplier_id: supplierId,
    receipt_image: data.receipt_image,
    description: data.description,
    created_by: user.id,
  });
  return transactionRepository.findById(id);
};

const uploadReceipt = async (id, receiptPath, user) => {
  const tx = await getById(id);
  if (["sales", "procurement", "production"].includes(user.role)) {
    if (tx.created_by !== user.id) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
  }
  if (tx.status !== "pending") {
    const err = new Error("Only pending transactions can receive receipt uploads");
    err.statusCode = 400;
    throw err;
  }
  await transactionRepository.updateReceipt(id, receiptPath);
  return transactionRepository.findById(id);
};

const managerApprove = async (id, userId) => {
  const tx = await getById(id);
  if (tx.status !== "accountant_approved") {
    const err = new Error("Only accountant-approved transactions can be approved by manager");
    err.statusCode = 400;
    throw err;
  }
  await transactionRepository.updateStatus(id, "manager_approved", userId);
  return transactionRepository.findById(id);
};

const accountantApprove = async (id, userId) => {
  const tx = await getById(id);
  if (tx.status !== "pending") {
    const err = new Error("Only pending transactions can be approved by accountant");
    err.statusCode = 400;
    throw err;
  }
  await transactionRepository.updateStatus(id, "accountant_approved", userId);
  return transactionRepository.findById(id);
};

const reject = async (id, userId, rejectionReason = null, role = null) => {
  const tx = await getById(id);
  if (role === "accountant") {
    if (tx.status !== "pending") {
      const err = new Error("Only pending transactions can be rejected by accountant");
      err.statusCode = 400;
      throw err;
    }
  } else if (role === "general_manager") {
    if (tx.status !== "accountant_approved") {
      const err = new Error("Only accountant-approved transactions can be rejected by manager");
      err.statusCode = 400;
      throw err;
    }
  } else {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  await transactionRepository.updateStatus(id, "rejected", userId, rejectionReason);
  return transactionRepository.findById(id);
};

// Financial calculations
const getCustomerCredit = async (customerId) => {
  return transactionRepository.getCustomerCredit(customerId);
};

const getSupplierDebt = async (supplierId) => {
  return transactionRepository.getSupplierDebt(supplierId);
};

const getDepartmentTransactions = async (sourceDepartment, userRole = null) => {
  return transactionRepository.getDepartmentTransactions(sourceDepartment, userRole);
};

module.exports = {
  TYPES,
  SOURCE_DEPARTMENTS,
  PAYMENT_TYPES,
  STATUS,
  list,
  getById,
  create,
  uploadReceipt,
  accountantApprove,
  managerApprove,
  reject,
  getCustomerCredit,
  getSupplierDebt,
  getDepartmentTransactions,
};

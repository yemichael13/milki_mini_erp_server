const supplierRepo = require("../repositories/supplier.repository");
const supplierPaymentRepo = require("../repositories/supplierPayment.repository");

const list = async (filters) => {
  return supplierPaymentRepo.list(filters);
};

const create = async (user, data, receiptUrl) => {
  if (user.role !== "accountant") {
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
  const id = await supplierPaymentRepo.create({
    ...data,
    receipt_url: receiptUrl || null,
    recorded_by: user.id,
  });
  return supplierPaymentRepo.findById(id);
};

module.exports = { list, create };


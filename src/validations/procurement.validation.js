const Joi = require("joi");

const createProcurementTransactionSchema = Joi.object({
  supplier_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().min(1).required(),
  payment_type: Joi.string().valid("paid", "debt").required(),
});

const resubmitProcurementTransactionSchema = Joi.object({
  supplier_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().allow("", null),
  payment_type: Joi.string().valid("paid", "debt").required(),
  rejection_reason: Joi.any().forbidden(),
}).required();

const listProcurementQuerySchema = Joi.object({
  status: Joi.string().valid("", "pending", "accountant_approved", "manager_approved", "rejected", "approved"),
});

const rejectSchema = Joi.object({
  description: Joi.string().required(),
});

module.exports = {
  createProcurementTransactionSchema,
  resubmitProcurementTransactionSchema,
  listProcurementQuerySchema,
  rejectSchema,
};

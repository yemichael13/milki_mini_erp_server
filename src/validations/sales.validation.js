const Joi = require("joi");

const createSalesTransactionSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().min(1).required(),
  payment_type: Joi.string().valid("paid", "credit").required(),
});

const resubmitSalesTransactionSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().allow("", null),
  payment_type: Joi.string().valid("paid", "credit").required(),
  rejection_reason: Joi.any().forbidden(),
}).required();

const listSalesQuerySchema = Joi.object({
  status: Joi.string().valid("", "pending", "accountant_approved", "manager_approved", "rejected", "approved"),
});

const rejectSchema = Joi.object({
  description: Joi.string().required(),
});

module.exports = {
  createSalesTransactionSchema,
  resubmitSalesTransactionSchema,
  listSalesQuerySchema,
  rejectSchema,
};


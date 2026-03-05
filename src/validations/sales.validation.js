const Joi = require("joi");

const createSalesTransactionSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().allow("", null),
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
  status: Joi.string().valid("pending", "accountant_approved", "manager_approved", "rejected"),
});

const rejectSchema = Joi.object({
  rejection_reason: Joi.string().allow("", null).required(),
});

module.exports = {
  createSalesTransactionSchema,
  resubmitSalesTransactionSchema,
  listSalesQuerySchema,
  rejectSchema,
};


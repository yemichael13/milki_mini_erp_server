const Joi = require("joi");

const createProductionTransactionSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().allow("", null),
});

const resubmitProductionTransactionSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().allow("", null),
  rejection_reason: Joi.any().forbidden(),
}).required();

const listProductionQuerySchema = Joi.object({
  status: Joi.string().valid("pending", "accountant_approved", "manager_approved", "rejected"),
});

const rejectSchema = Joi.object({
  rejection_reason: Joi.string().allow("", null).required(),
});

module.exports = {
  createProductionTransactionSchema,
  resubmitProductionTransactionSchema,
  listProductionQuerySchema,
  rejectSchema,
};


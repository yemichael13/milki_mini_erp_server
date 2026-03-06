const Joi = require("joi");

const createProductionTransactionSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().min(1).required(),
});

const resubmitProductionTransactionSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().min(1).required(),
  rejection_reason: Joi.any().forbidden(),
}).required();

const listProductionQuerySchema = Joi.object({
  status: Joi.string().valid("", "pending", "accountant_approved", "manager_approved", "rejected", "approved"),
});

const rejectSchema = Joi.object({
  description: Joi.string().required(),
});

module.exports = {
  createProductionTransactionSchema,
  resubmitProductionTransactionSchema,
  listProductionQuerySchema,
  rejectSchema,
};


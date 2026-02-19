const Joi = require("joi");

const createTransactionSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
  total_amount: Joi.number().positive().required(),
  description: Joi.string().allow("", null),
});

const approveSchema = Joi.object({
  rejection_reason: Joi.string().allow("", null),
}).when(Joi.ref("status"), {
  is: "rejected",
  then: Joi.object({ rejection_reason: Joi.string().optional() }),
  otherwise: Joi.object({}),
});

const statusSchema = Joi.object({
  status: Joi.string().valid("accountant_approved", "manager_approved", "rejected").required(),
  rejection_reason: Joi.string().allow("", null),
});

const listQuerySchema = Joi.object({
  workflow: Joi.string().valid("sales", "production", "procurement"),
  status: Joi.string().valid("pending", "accountant_approved", "manager_approved", "rejected"),
  customer_id: Joi.number().integer().positive(),
  from_date: Joi.date().iso(),
  to_date: Joi.date().iso(),
});

const rejectBodySchema = Joi.object({
  rejection_reason: Joi.string().allow("", null),
});

module.exports = {
  createTransactionSchema,
  approveSchema,
  statusSchema,
  listQuerySchema,
  rejectBodySchema,
};

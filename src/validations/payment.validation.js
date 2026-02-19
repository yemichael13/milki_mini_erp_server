const Joi = require("joi");

const createPaymentSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  payment_date: Joi.date().required(),
  reference: Joi.string().allow("", null),
});

const listQuerySchema = Joi.object({
  customer_id: Joi.number().integer().positive(),
  from_date: Joi.date().iso(),
  to_date: Joi.date().iso(),
});

module.exports = { createPaymentSchema, listQuerySchema };

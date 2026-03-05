const Joi = require("joi");

const createCustomerPaymentSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  payment_date: Joi.date().iso().required(),
  reference: Joi.string().allow("", null),
});

const listCustomerPaymentQuerySchema = Joi.object({
  customer_id: Joi.number().integer().positive(),
  from_date: Joi.date().iso(),
  to_date: Joi.date().iso(),
});

module.exports = { createCustomerPaymentSchema, listCustomerPaymentQuerySchema };


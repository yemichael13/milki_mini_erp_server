const Joi = require("joi");

const createSupplierPaymentSchema = Joi.object({
  supplier_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  payment_date: Joi.date().iso().required(),
  reference: Joi.string().allow("", null),
});

const listSupplierPaymentQuerySchema = Joi.object({
  supplier_id: Joi.number().integer().positive(),
  from_date: Joi.date().iso(),
  to_date: Joi.date().iso(),
});

module.exports = { createSupplierPaymentSchema, listSupplierPaymentQuerySchema };


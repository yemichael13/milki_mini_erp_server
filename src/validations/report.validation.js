const Joi = require("joi");

const reportQuerySchema = Joi.object({
  from_date: Joi.date().iso(),
  to_date: Joi.date().iso(),
  customer_id: Joi.number().integer().positive(),
  supplier_id: Joi.number().integer().positive(),
  format: Joi.string().valid("json", "csv").default("json"),
  type: Joi.string().valid("sale", "procurement", "production"),
  status: Joi.string().valid("pending", "accountant_approved", "manager_approved", "rejected"),
  source_department: Joi.string().valid("sales", "procurement", "production"),
});

module.exports = { reportQuerySchema };

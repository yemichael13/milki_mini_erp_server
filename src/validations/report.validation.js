const Joi = require("joi");

const reportQuerySchema = Joi.object({
  from_date: Joi.date().iso(),
  to_date: Joi.date().iso(),
  customer_id: Joi.number().integer().positive(),
  format: Joi.string().valid("json", "csv").default("json"),
});

module.exports = { reportQuerySchema };

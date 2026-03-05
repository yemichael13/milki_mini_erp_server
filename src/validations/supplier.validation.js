const Joi = require("joi");

const createSupplierSchema = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email().allow("", null),
  phone: Joi.string().allow("", null),
  address: Joi.string().allow("", null),
});

const supplierSearchSchema = Joi.object({
  search: Joi.string().allow("", null),
});

module.exports = { createSupplierSchema, supplierSearchSchema };


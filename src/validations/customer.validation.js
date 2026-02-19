const Joi = require("joi");

const createCustomerSchema = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email().allow("", null),
  phone: Joi.string().allow("", null),
  address: Joi.string().allow("", null),
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().min(1),
  email: Joi.string().email().allow("", null),
  phone: Joi.string().allow("", null),
  address: Joi.string().allow("", null),
}).min(1);

module.exports = { createCustomerSchema, updateCustomerSchema };

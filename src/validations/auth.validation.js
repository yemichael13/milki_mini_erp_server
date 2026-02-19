const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(1).required(),
  role: Joi.string().valid("sales", "production", "procurement", "accountant", "manager", "admin").required(),
});

module.exports = { loginSchema, registerSchema };

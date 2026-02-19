const Joi = require("joi");

const updateUserSchema = Joi.object({
  full_name: Joi.string().min(1),
  role: Joi.string().valid("sales", "production", "procurement", "accountant", "manager", "admin"),
  is_active: Joi.boolean(),
  password: Joi.string().min(6),
}).min(1);

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(1).required(),
  role: Joi.string().valid("sales", "production", "procurement", "accountant", "manager", "admin").required(),
});

module.exports = { updateUserSchema, createUserSchema };

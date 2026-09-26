const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
const emailSchema = Joi.object({ email: Joi.string().email().required() });
const resetSchema = Joi.object({ token: Joi.string().required(), password: Joi.string().min(8).max(128).required() });
const changePasswordSchema = Joi.object({ currentPassword: Joi.string().required(), newPassword: Joi.string().min(8).max(128).required() });

module.exports = { loginSchema, emailSchema, resetSchema, changePasswordSchema };

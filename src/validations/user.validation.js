const Joi = require("joi");

const updateUserSchema = Joi.object({
  full_name: Joi.string().min(1),
  role: Joi.string().valid(
    "system_admin",
    "admin",
    "manager",
    "general_manager",
    "accountant",
    "sales",
    "procurement",
    "production",
    "production_officer",
    "procurement_officer",
    "sales_officer",
    "production_recorder",
    "production_approver"
  ),
  is_active: Joi.boolean(),
  password: Joi.string().min(6),
}).min(1);

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(1).required(),
  role: Joi.string()
    .valid(
      "system_admin",
      "admin",
      "manager",
      "general_manager",
      "accountant",
      "sales",
      "procurement",
      "production",
      "production_officer",
      "procurement_officer",
      "sales_officer",
      "production_recorder",
      "production_approver"
    )
    .required(),
});

module.exports = { updateUserSchema, createUserSchema };

const Joi = require("joi");

const inventoryListQuerySchema = Joi.object({
  product_type: Joi.string().allow(""),
  package_size_kg: Joi.number().positive(),
  package_label: Joi.string().allow(""),
  product_id: Joi.number().integer().positive(),
  status: Joi.string().valid(
    "",
    "production_pending",
    "production_approved",
    "manager_pending",
    "manager_approved",
    "rejected"
  ),
  created_by: Joi.number().integer().positive(),
  creator: Joi.string().allow(""),
  approver: Joi.string().allow(""),
  from_date: Joi.date().iso(),
  to_date: Joi.date().iso(),
  is_active: Joi.boolean(),
}).unknown(true);

const createProductionRecordSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity_pieces: Joi.number().integer().positive().required(),
  production_date: Joi.date().iso().required(),
  description: Joi.string().allow("").optional(),
});

const createProductReleaseSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity_pieces: Joi.number().integer().positive().required(),
  release_date: Joi.date().iso().required(),
  description: Joi.string().allow("").optional(),
});

const createProductReturnSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity_pieces: Joi.number().integer().positive().required(),
  production_date: Joi.date().iso().required(),
  release_date: Joi.date().iso().required(),
  return_date: Joi.date().iso().required(),
  description: Joi.string().allow("").optional(),
});

const rejectSchema = Joi.object({
  rejection_reason: Joi.string().min(1).required(),
});

module.exports = {
  inventoryListQuerySchema,
  createProductionRecordSchema,
  createProductReleaseSchema,
  createProductReturnSchema,
  rejectSchema,
};

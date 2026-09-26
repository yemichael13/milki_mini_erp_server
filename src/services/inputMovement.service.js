const pool = require("../config/db");
const productRepository = require("../repositories/product.repository");
const repository = require("../repositories/inputMovement.repository");
const { audit } = require("./security.service");

const APPROVAL = "production_pending";
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const ensure = (user, roles) => { if (!roles.includes(user?.role)) throw fail("Forbidden", 403); };
const balance = async (productId, db = pool) => {
  const received = await repository.sum(productId, "receipt", "manager_approved", db);
  const issued = await repository.sum(productId, "issue", "manager_approved", db);
  const returned = await repository.sum(productId, "return", "manager_approved", db);
  return { pieces: received.pieces + returned.pieces - issued.pieces, quintals: received.quintals + returned.quintals - issued.quintals };
};

const list = (user, filters) => { ensure(user, ["production_recorder", "production_approver", "general_manager", "accountant", "system_admin"]); return repository.list(filters); };
const create = async (user, data) => {
  ensure(user, ["production_recorder"]);
  if (!["receipt", "issue", "return"].includes(data.movement_type)) throw fail("Invalid input movement type");
  const product = await productRepository.findById(data.product_id);
  if (!product || product.inventory_type !== "INPUT" || !product.is_active) throw fail("Only active Input products can be used", 400);
  const quintals = Number(data.quantity_quintal);
  if (!Number.isFinite(quintals) || quintals <= 0) throw fail("Quantity must be greater than zero");
  const pieces = quintals * 2;
  if (!Number.isInteger(pieces)) throw fail("Input quantity must use half-quintal increments because one piece equals 0.5 quintal");
  if (data.movement_type === "issue") { const current = await balance(product.id); if (pieces > current.pieces) throw fail("Issue quantity exceeds available raw-material stock"); }
  const id = await repository.create({ product_id: product.id, movement_type: data.movement_type, quantity_pieces: pieces, total_weight_quintal: Number(quintals.toFixed(2)), movement_date: data.movement_date, description: data.description, status: APPROVAL, created_by: user.id });
  await audit("INPUT_MOVEMENT_CREATED", user.id, { movementId: id, movementType: data.movement_type });
  return repository.findById(id);
};
const approve = async (user, id) => { ensure(user, ["production_approver"]); const row = await repository.findById(id); if (!row || row.status !== "production_pending") throw fail("Only pending input movements can be approved"); await repository.update(id, { status: "manager_pending", approved_by: user.id, approved_at: new Date() }); return repository.findById(id); };
const managerApprove = async (user, id) => { ensure(user, ["general_manager"]); const row = await repository.findById(id); if (!row || !["manager_pending", "production_approved"].includes(row.status)) throw fail("Only manager-pending input movements can be approved"); if (row.movement_type === "issue") { const current = await balance(row.product_id); if (row.quantity_pieces > current.pieces) throw fail("Issue quantity exceeds available raw-material stock"); } await repository.update(id, { status: "manager_approved", manager_approved_by: user.id, manager_approved_at: new Date() }); return repository.findById(id); };
const reject = async (user, id, reason) => { ensure(user, ["production_approver", "general_manager"]); const row = await repository.findById(id); if (!row || row.status === "manager_approved") throw fail("This input movement cannot be rejected"); await repository.update(id, { status: "rejected", rejection_reason: reason }); return repository.findById(id); };

module.exports = { list, create, approve, managerApprove, reject, balance };

const service = require("../services/inputMovement.service");
const filters = (req) => ({ movement_type: req.query.movement_type, product_id: req.query.product_id, status: req.query.status });
const list = async (req, res, next) => { try { res.json(await service.list(req.user, filters(req))); } catch (e) { next(e); } };
const create = async (req, res, next) => { try { res.status(201).json(await service.create(req.user, req.body)); } catch (e) { next(e); } };
const approve = async (req, res, next) => { try { res.json(await service.approve(req.user, Number(req.params.id))); } catch (e) { next(e); } };
const managerApprove = async (req, res, next) => { try { res.json(await service.managerApprove(req.user, Number(req.params.id))); } catch (e) { next(e); } };
const reject = async (req, res, next) => { try { res.json(await service.reject(req.user, Number(req.params.id), req.body.rejection_reason)); } catch (e) { next(e); } };
module.exports = { list, create, approve, managerApprove, reject };

const transactionService = require("../services/transaction.service");
const logger = require("../config/logger");

const createController = (workflow) => ({
  list: async (req, res, next) => {
    try {
      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.customer_id) filters.customer_id = Number(req.query.customer_id);
      if (req.query.from_date) filters.from_date = req.query.from_date;
      if (req.query.to_date) filters.to_date = req.query.to_date;
      const list = await transactionService.list(workflow, filters);
      res.json(list);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const tx = await transactionService.getById(Number(req.params.id), workflow);
      res.json(tx);
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const data = { ...req.body };
      if (req.file) data.receipt_path = req.file.path || req.file.filename;
      const tx = await transactionService.create(workflow, data, req.user.id);
      logger.info({
        message: `${workflow} transaction created`,
        transactionId: tx.id,
        userId: req.user.id,
      });
      res.status(201).json(tx);
    } catch (err) {
      next(err);
    }
  },

  uploadReceipt: async (req, res, next) => {
    try {
      if (!req.file) {
        const err = new Error("No receipt file uploaded");
        err.statusCode = 400;
        return next(err);
      }
      const path = req.file.path || req.file.filename;
      const tx = await transactionService.uploadReceipt(
        Number(req.params.id),
        workflow,
        path,
        req.user.id
      );
      res.json(tx);
    } catch (err) {
      next(err);
    }
  },

  accountantApprove: async (req, res, next) => {
    try {
      const tx = await transactionService.accountantApprove(
        Number(req.params.id),
        workflow,
        req.user.id
      );
      logger.info({
        message: `${workflow} transaction accountant approved`,
        transactionId: tx.id,
        userId: req.user.id,
      });
      res.json(tx);
    } catch (err) {
      next(err);
    }
  },

  managerApprove: async (req, res, next) => {
    try {
      const tx = await transactionService.managerApprove(
        Number(req.params.id),
        workflow,
        req.user.id
      );
      logger.info({
        message: `${workflow} transaction manager approved`,
        transactionId: tx.id,
        userId: req.user.id,
      });
      res.json(tx);
    } catch (err) {
      next(err);
    }
  },

  reject: async (req, res, next) => {
    try {
      const reason = req.body.rejection_reason || null;
      const tx = await transactionService.reject(
        Number(req.params.id),
        workflow,
        req.user.id,
        reason
      );
      logger.info({
        message: `${workflow} transaction rejected`,
        transactionId: tx.id,
        userId: req.user.id,
      });
      res.json(tx);
    } catch (err) {
      next(err);
    }
  },
});

module.exports = createController;

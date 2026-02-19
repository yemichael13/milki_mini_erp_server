const userService = require("../services/user.service");
const logger = require("../config/logger");

const list = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.role) filters.role = req.query.role;
    if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === "true";
    const users = await userService.list(filters);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const user = await userService.getById(Number(req.params.id));
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const user = await userService.create(req.body);
    logger.info({ message: "User created", userId: user.id, by: req.user.id });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await userService.update(Number(req.params.id), req.body);
    logger.info({ message: "User updated", userId: req.params.id, by: req.user.id });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update };

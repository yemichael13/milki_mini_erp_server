const authService = require("../services/auth.service");
const logger = require("../config/logger");

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    logger.info({ message: "User logged in", userId: result.user.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await require("../services/user.service").getById(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, me };

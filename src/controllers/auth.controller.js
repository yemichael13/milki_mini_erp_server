const authService = require("../services/auth.service");
const logger = require("../config/logger");

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    logger.info({ message: "User logged in", userId: result.user.id });
    res.cookie("milki_refresh", result.refreshToken, authService.cookieOptions());
    delete result.refreshToken;
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => { try { const result = await authService.refresh(req.cookies?.milki_refresh || req.headers.cookie?.match(/(?:^|; )milki_refresh=([^;]+)/)?.[1]); res.cookie("milki_refresh", result.refreshToken, authService.cookieOptions()); delete result.refreshToken; res.json(result); } catch (err) { next(err); } };
const logout = async (req, res, next) => { try { await authService.revokeRefreshToken(req.cookies?.milki_refresh || req.headers.cookie?.match(/(?:^|; )milki_refresh=([^;]+)/)?.[1]); res.clearCookie("milki_refresh", authService.cookieOptions()); res.json({ message: "Logged out" }); } catch (err) { next(err); } };
const verifyEmail = async (req, res, next) => { try { await authService.verifyEmail(req.query.token); res.json({ message: "Email verified" }); } catch (err) { next(err); } };
const forgotPassword = async (req, res, next) => { try { await authService.forgotPassword(req.body.email); res.json({ message: "If an account exists for this email, a password reset link has been sent." }); } catch (err) { next(err); } };
const resetPassword = async (req, res, next) => { try { await authService.resetPassword(req.body.token, req.body.password); res.json({ message: "Password reset successfully" }); } catch (err) { next(err); } };
const changePassword = async (req, res, next) => { try { await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword); res.json({ message: "Password changed successfully" }); } catch (err) { next(err); } };

const me = async (req, res, next) => {
  try {
    const user = await require("../services/user.service").getById(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, me, refresh, logout, verifyEmail, forgotPassword, resetPassword, changePassword };

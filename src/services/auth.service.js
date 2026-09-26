const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const userRepository = require("../repositories/user.repository");
const { createToken, hashToken } = require("../utils/authTokens");
const { accessTokenExpires, refreshTokenDays } = require("../config/config");
const emailService = require("./email.service");
const { audit } = require("./security.service");

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const access = (user) => jwt.sign({ sub: String(user.id), role: user.role, type: "access" }, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET, { expiresIn: accessTokenExpires });
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth" });
const getUser = async (id) => { const [rows] = await pool.query("SELECT email FROM users WHERE id = ?", [id]); return rows[0] ? userRepository.findByEmail(rows[0].email) : null; };

const issueRefresh = async (userId) => {
  const raw = createToken();
  await pool.query("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))", [userId, hashToken(raw), refreshTokenDays]);
  return raw;
};
const revokeRefreshToken = async (raw) => { if (raw) await pool.query("UPDATE refresh_tokens SET revoked_at = NOW(), last_used_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL", [hashToken(raw)]); };
const publicUser = (u) => ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role });

const login = async (email, password) => {
  const user = await userRepository.findByEmail(email.toLowerCase().trim());
  if (!user || !user.is_active || (user.locked_until && new Date(user.locked_until) > new Date())) throw fail("Invalid credentials", 401);
  if (!user.email_verified_at) throw fail("Please verify your email before signing in", 403);
  if (!(await bcrypt.compare(password, user.password_hash))) {
    const attempts = Number(user.failed_login_attempts || 0) + 1;
    await userRepository.update(user.id, { failed_login_attempts: attempts, locked_until: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null });
    await audit(attempts >= 5 ? "ACCOUNT_LOCKED" : "LOGIN_FAILED", user.id);
    throw fail("Invalid credentials", 401);
  }
  await userRepository.update(user.id, { failed_login_attempts: 0, locked_until: null });
  await audit("LOGIN_SUCCESS", user.id);
  return { token: access(user), refreshToken: await issueRefresh(user.id), user: publicUser(user) };
};

const refresh = async (raw) => {
  const [rows] = await pool.query("SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()", [hashToken(raw || "")]);
  const session = rows[0]; if (!session) throw fail("Unauthorized", 401);
  await revokeRefreshToken(raw); const user = await getUser(session.user_id);
  if (!user || !user.is_active) throw fail("Unauthorized", 401);
  return { token: access(user), refreshToken: await issueRefresh(user.id), user: publicUser(user) };
};

const verifyEmail = async (raw) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE email_verification_token_hash = ? AND email_verification_expires_at > NOW()", [hashToken(raw || "")]);
  if (!rows[0]) throw fail("Invalid or expired verification link");
  await userRepository.update(rows[0].id, { email_verified_at: new Date(), email_verification_token_hash: null, email_verification_expires_at: null });
  await audit("EMAIL_VERIFIED", rows[0].id);
};
const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email.toLowerCase().trim());
  if (!user || !user.is_active) return;
  const token = createToken(); await userRepository.update(user.id, { password_reset_token_hash: hashToken(token), password_reset_expires_at: new Date(Date.now() + 3600000) });
  await emailService.sendPasswordResetEmail(user, token); await audit("PASSWORD_RESET_REQUESTED", user.id);
};
const resetPassword = async (raw, password) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE password_reset_token_hash = ? AND password_reset_expires_at > NOW()", [hashToken(raw || "")]);
  if (!rows[0] || !rows[0].is_active) throw fail("Invalid or expired reset link");
  const user = rows[0]; await userRepository.update(user.id, { password_hash: await bcrypt.hash(password, 12), password_reset_token_hash: null, password_reset_expires_at: null });
  await pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", [user.id]); await audit("PASSWORD_RESET_COMPLETED", user.id);
};
const changePassword = async (id, currentPassword, newPassword) => {
  const user = await getUser(id); if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) throw fail("Current password is incorrect");
  if (currentPassword === newPassword) throw fail("New password must differ from current password");
  await userRepository.update(id, { password_hash: await bcrypt.hash(newPassword, 12) }); await pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", [id]); await audit("PASSWORD_CHANGED", id);
};

module.exports = { login, refresh, revokeRefreshToken, verifyEmail, forgotPassword, resetPassword, changePassword, cookieOptions };

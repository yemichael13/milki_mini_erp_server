const bcrypt = require("bcrypt");
const userRepository = require("../repositories/user.repository");
const pool = require("../config/db");
const { normalizeRole, toDbRole } = require("../utils/role");
const { createToken, hashToken } = require("../utils/authTokens");
const emailService = require("./email.service");
const { audit } = require("./security.service");

let cachedRoleEnum = null;

const getRoleEnumValues = async () => {
  if (cachedRoleEnum) return cachedRoleEnum;
  const [rows] = await pool.query("SHOW COLUMNS FROM users LIKE 'role'");
  const type = rows?.[0]?.Type || rows?.[0]?.type;
  if (!type) return null;
  const match = type.match(/^enum\((.*)\)$/i);
  if (!match) return null;
  cachedRoleEnum = match[1]
    .split(",")
    .map((v) => v.trim().replace(/^'(.*)'$/, "$1"));
  return cachedRoleEnum;
};

const mapRoleForDb = async (role) => {
  const desired = toDbRole(role);
  const allowed = await getRoleEnumValues();
  if (!allowed || allowed.length === 0) return desired;
  if (allowed.includes(desired)) return desired;

  const baseRole = normalizeRole(role);
  if (["sales", "procurement", "production"].includes(desired)) {
    const officerRole = `${desired}_officer`;
    if (allowed.includes(officerRole)) return officerRole;
  }

  if (["system_admin", "admin"].includes(role)) {
    if (allowed.includes("admin")) return "admin";
    if (allowed.includes("system_admin")) return "system_admin";
  }

  if (allowed.includes(baseRole)) return baseRole;
  return desired;
};

const list = async (filters) => {
  return userRepository.findAll(filters);
};

// helper used by startup scripts to ensure at least one admin exists
const ensureDefaultAdmin = async () => {
  const DEFAULT_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@milki.com";
  const DEFAULT_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "Milkiadmin@2026";
  const DEFAULT_FULLNAME = process.env.DEFAULT_ADMIN_NAME || "System Administrator";

  const existing = await userRepository.findByEmail(DEFAULT_EMAIL);
  if (existing) return;

  const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const id = await userRepository.create({
    email: DEFAULT_EMAIL,
    password_hash,
    full_name: DEFAULT_FULLNAME,
    role: await mapRoleForDb("system_admin"),
    email_verified_at: new Date(),
  });
  console.log(`Default admin created (${DEFAULT_EMAIL})`);
};

const getById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return user;
};

const create = async (data) => {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    throw err;
  }
  const password_hash = await bcrypt.hash(data.password, 12);
  const verificationToken = createToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const id = await userRepository.create({
    email: data.email,
    password_hash,
    full_name: data.full_name,
    role: await mapRoleForDb(data.role),
    email_verification_token_hash: hashToken(verificationToken),
    email_verification_expires_at: verificationExpires,
  });
  const user = await userRepository.findByEmail(data.email);
  await emailService.sendVerificationEmail(user, verificationToken);
  await audit("USER_CREATED", data.createdBy || null, { createdUserId: id });
  return userRepository.findById(id);
};

const update = async (id, data) => {
  await getById(id);
  const payload = { ...data };
  if (payload.role) {
    payload.role = await mapRoleForDb(payload.role);
  }
  if (data.password) {
    payload.password_hash = await bcrypt.hash(data.password, 12);
    delete payload.password;
  }
  await userRepository.update(id, payload);
  return userRepository.findById(id);
};

const remove = async (id, currentUserId) => {
  const user = await getById(id);

  if (Number(id) === Number(currentUserId)) {
    const err = new Error("You cannot delete your own account");
    err.statusCode = 400;
    throw err;
  }

  if (user.role === "system_admin") {
    const activeAdmins = await userRepository.countActiveByRoles(["admin", "system_admin"]);
    if (activeAdmins <= 1 && user.is_active) {
      const err = new Error("At least one active system admin must remain");
      err.statusCode = 400;
      throw err;
    }
  }

  if (!user.is_active) {
    return user;
  }

  await userRepository.update(id, { is_active: false });
  return userRepository.findById(id);
};

module.exports = { list, getById, create, update, remove, ensureDefaultAdmin };

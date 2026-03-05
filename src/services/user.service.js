const bcrypt = require("bcrypt");
const userRepository = require("../repositories/user.repository");

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
  await userRepository.create({
    email: DEFAULT_EMAIL,
    password_hash,
    full_name: DEFAULT_FULLNAME,
    role: "admin",
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
  const password_hash = await bcrypt.hash(data.password, 10);
  const id = await userRepository.create({
    email: data.email,
    password_hash,
    full_name: data.full_name,
    role: data.role,
  });
  return userRepository.findById(id);
};

const update = async (id, data) => {
  await getById(id);
  const payload = { ...data };
  if (data.password) {
    payload.password_hash = await bcrypt.hash(data.password, 10);
    delete payload.password;
  }
  await userRepository.update(id, payload);
  return userRepository.findById(id);
};

module.exports = { list, getById, create, update, ensureDefaultAdmin };

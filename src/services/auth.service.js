const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/user.repository");
const { loginSchema, registerSchema } = require("../validations/auth.validation");

const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.is_active) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "1d" }
  );
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
  };
};

const register = async (data) => {
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
  const user = await userRepository.findById(id);
  return { id: user.id, email: user.email, full_name: user.full_name, role: user.role };
};

module.exports = { login, register };

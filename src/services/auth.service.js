const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/user.repository");

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

module.exports = { login };

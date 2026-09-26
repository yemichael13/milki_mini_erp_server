const accessTokenExpires = process.env.JWT_ACCESS_EXPIRES || "20m";
const refreshTokenDays = Number(process.env.REFRESH_TOKEN_DAYS || 7);

module.exports = {
  accessTokenExpires,
  refreshTokenDays,
  frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173",
};

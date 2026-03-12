const normalizeRole = (role) => {
  if (!role) return role;
  if (role === "admin") return "system_admin";
  if (role.endsWith("_officer")) return role.split("_")[0];
  return role;
};

const toDbRole = (role) => {
  if (!role) return role;
  if (role === "system_admin") return "admin";
  if (role.endsWith("_officer")) return role.split("_")[0];
  return role;
};

module.exports = { normalizeRole, toDbRole };

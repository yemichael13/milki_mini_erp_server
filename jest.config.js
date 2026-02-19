module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.js"],
  setupFilesAfterEnv: ["./test/setup.js"],
  testTimeout: 15000,
  verbose: true,
};

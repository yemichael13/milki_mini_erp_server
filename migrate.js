require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    const migrations = [
      "003_unified_schema.sql",
      "004_production_inventory.sql",
    ];

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, "migrations", migration);
      const migrationSQL = fs.readFileSync(migrationPath, "utf8");

      console.log(`Running migration ${migration}...`);
      await connection.query(migrationSQL);
    }

    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await connection.end();
  }
}

runMigration();

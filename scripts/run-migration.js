const { readFileSync, existsSync } = require("fs");
const { join } = require("path");
const { Pool } = require("pg");

function loadDatabaseUrlFromEnvFile() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return null;

  try {
    const contents = readFileSync(envPath, "utf-8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      if (trimmed.startsWith("DATABASE_URL=")) {
        // Remove DATABASE_URL= and any surrounding quotes
        let value = trimmed.slice("DATABASE_URL=".length).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return value;
      }
    }
  } catch (err) {
    console.error("Failed to read .env file:", err.message);
  }
  return null;
}

async function runMigration() {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error("Usage: node scripts/run-migration.js <migration-file>");
    console.error(
      "Example: node scripts/run-migration.js db/migrations/006_add_lead_creator.sql"
    );
    process.exit(1);
  }

  let connectionString = process.env.DATABASE_URL || loadDatabaseUrlFromEnvFile();

  if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set and .env could not be read");
    process.exit(1);
  }

  // Handle Aiven-style sslmode=require the same way as in src/lib/db.ts
  let ssl = undefined;
  const isAiven = connectionString.includes("aivencloud.com");

  if (connectionString.includes("sslmode=require")) {
    connectionString = connectionString.replace("sslmode=require", "sslmode=no-verify");
  }

  if (isAiven) {
    ssl = { rejectUnauthorized: false };
  }

  const sql = readFileSync(join(process.cwd(), migrationFile), "utf-8");
  const pool = new Pool({ connectionString, ssl });

  try {
    console.log(`Running migration: ${migrationFile}`);
    await pool.query(sql);
    console.log("✅ Migration completed successfully");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();


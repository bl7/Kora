const { Pool } = require("pg");
const { readFileSync, existsSync } = require("fs");
const { join } = require("path");

function loadDatabaseUrlFromEnvFile() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return null;

  try {
    const contents = readFileSync(envPath, "utf-8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      if (trimmed.startsWith("DATABASE_URL=")) {
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

async function clearDatabase() {
  let connectionString = process.env.DATABASE_URL || loadDatabaseUrlFromEnvFile();
  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set and .env could not be read");
    process.exit(1);
  }

  let ssl = undefined;
  const isAiven = connectionString.includes("aivencloud.com");

  if (connectionString.includes("sslmode=require")) {
    connectionString = connectionString.replace("sslmode=require", "sslmode=no-verify");
  }

  if (isAiven) {
    ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool({ connectionString, ssl });

  try {
    console.log("⚠️  About to truncate all tenant data tables (companies cascade, tokens, etc.)");
    await pool.query("BEGIN");
    // Truncate root tables; CASCADE clears all dependent rows.
    await pool.query("TRUNCATE TABLE order_items, orders, leads, shop_assignments, shops, products, product_prices, company_users, companies, tokens, users RESTART IDENTITY CASCADE");
    await pool.query("COMMIT");
    console.log("✅ Database cleared successfully (all data removed, schema preserved).");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Failed to clear database:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearDatabase();



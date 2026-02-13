import { Pool } from "pg";

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

export function getDb() {
  if (globalForPg.pgPool) {
    return globalForPg.pgPool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const normalizedConnectionString = normalizeConnectionString(connectionString);
  
  // Determine SSL config: Aiven uses self-signed certs, so we need to allow them
  // Check if connection string has sslmode=require or if it's an Aiven host
  const url = new URL(normalizedConnectionString);
  const isAiven = url.hostname.includes("aivencloud.com");
  const sslMode = url.searchParams.get("sslmode");
  const needsRelaxedSSL = isAiven || sslMode === "require" || sslMode === "no-verify";
  
  const pool = new Pool({
    connectionString: normalizedConnectionString,
    // Aiven uses self-signed certificates, so we need to allow them even in production
    ssl: needsRelaxedSSL ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPg.pgPool = pool;
  }

  return pool;
}

function normalizeConnectionString(rawConnectionString: string) {
  try {
    const url = new URL(rawConnectionString);
    const sslMode = url.searchParams.get("sslmode");

    // For Aiven (self-signed certs), normalize sslmode to no-verify
    // This helps avoid SSL certificate chain errors
    if (url.hostname.includes("aivencloud.com")) {
      if (sslMode === "require" || sslMode === "prefer") {
        url.searchParams.set("sslmode", "no-verify");
      }
    }

    return url.toString();
  } catch {
    return rawConnectionString;
  }
}


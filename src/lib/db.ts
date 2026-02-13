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
  const pool = new Pool({
    connectionString: normalizedConnectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false },
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

    // In local/dev environments we intentionally skip strict cert validation
    // unless caller explicitly opts into no-verify semantics in the URL.
    if (
      process.env.NODE_ENV !== "production" &&
      url.searchParams.get("sslmode") === "require"
    ) {
      url.searchParams.set("sslmode", "no-verify");
    }

    return url.toString();
  } catch {
    return rawConnectionString;
  }
}


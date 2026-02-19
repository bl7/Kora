const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL must be set in the environment.");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Just in case, though .env didn't specify strict SSL
});

async function run() {
    try {
        console.log("Connecting to DB...");
        const client = await pool.connect();
        console.log("Connected.");

        const sql = `
    BEGIN;

    CREATE TABLE IF NOT EXISTS regions (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name        TEXT        NOT NULL,
      description TEXT,
      color       TEXT        NOT NULL DEFAULT '#f4a261',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (company_id, name)
    );

    CREATE INDEX IF NOT EXISTS idx_regions_company ON regions (company_id);

    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'region_id') THEN
            ALTER TABLE shops ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
        END IF;
    END
    $$;

    ALTER TABLE company_users
    ADD COLUMN IF NOT EXISTS default_region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

    COMMIT;
    `;

        console.log("Running SQL...");
        await client.query(sql);
        console.log("Migration executed successfully!");
        client.release();
        await pool.end();
    } catch (err) {
        console.error("Migration FAILED:", err);
        process.exit(1);
    }
}

run();

const { Pool } = require('pg');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/dbname';
if (!process.env.DATABASE_URL) {
    console.warn("Warning: DATABASE_URL not set in environment, using fallback.");
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        console.log("Checking regions table...");
        // Just select count(*) or similar
        const res = await pool.query("SELECT count(*) FROM regions");
        fs.writeFileSync('verification.txt', 'OK: Table regions exists. Count: ' + res.rows[0].count);
        // Check Columns in 'shops' table for 'region_id'
        const shopCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'region_id'");
        if (shopCols.rows.length > 0) {
            fs.appendFileSync('verification.txt', '\nOK: Shop region_id column exists.');
        } else {
            fs.appendFileSync('verification.txt', '\nERROR: Shop region_id column MISSING.');
        }
    } catch (err) {
        fs.writeFileSync('verification.txt', 'ERROR: ' + err.message);
    } finally {
        await pool.end();
    }
})();

const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/salessuite';
const pool = new Pool({ connectionString: connectionString.replace(/[?&]sslmode=\\w+/, '') });
async function test() {
  const res = await pool.query("SELECT id, started_at FROM visits ORDER BY started_at DESC LIMIT 1");
  console.log('from db:', res.rows[0].started_at);
  console.log('json:', JSON.stringify(res.rows[0].started_at));
}
test().catch(console.error).finally(() => pool.end());

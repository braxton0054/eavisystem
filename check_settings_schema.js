const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.WEST_DB_URL });

async function checkSchema() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'campus_settings'
    `);
        console.log('Columns:', res.rows.map(r => r.column_name));
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}
checkSchema();

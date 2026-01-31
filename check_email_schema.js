const { Pool } = require('pg');
require('dotenv').config();

const twonPool = new Pool({ connectionString: process.env.TWON_DB_URL });
const westPool = new Pool({ connectionString: process.env.WEST_DB_URL });

async function checkEmailConstraint(pool, campusName) {
    const client = await pool.connect();
    try {
        const query = `
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name='students' AND column_name='email';
    `;
        const result = await client.query(query);
        if (result.rows.length > 0) {
            console.log(`${campusName} 'email' is_nullable: ${result.rows[0].is_nullable}`);
        } else {
            console.log(`${campusName} 'email' column not found.`);
        }
    } catch (err) {
        console.error(`Error checking ${campusName}:`, err.message);
    } finally {
        client.release();
    }
}

async function run() {
    await checkEmailConstraint(westPool, 'West Campus');
    await checkEmailConstraint(twonPool, 'Twon Campus');
    await westPool.end();
    await twonPool.end();
}

run();

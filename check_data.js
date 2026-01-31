const { Pool } = require('pg');
require('dotenv').config();

const twonPool = new Pool({ connectionString: process.env.TWON_DB_URL });

async function checkData() {
    try {
        const result = await twonPool.query(`
            SELECT admission_number, campus_name 
            FROM students 
            LIMIT 5
        `);
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await twonPool.end();
    }
}

checkData();

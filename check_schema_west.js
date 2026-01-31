const { Pool } = require('pg');
require('dotenv').config();

const westPool = new Pool({ connectionString: process.env.WEST_DB_URL });

async function checkSchema() {
    try {
        const result = await westPool.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('courses', 'students')
            AND table_schema = 'public'
        `);
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await westPool.end();
    }
}

checkSchema();

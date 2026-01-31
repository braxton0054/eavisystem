const { Pool } = require('pg');
require('dotenv').config();

const twonPool = new Pool({ connectionString: process.env.TWON_DB_URL });

async function checkPdfPaths() {
    try {
        const result = await twonPool.query(`
            SELECT admission_number, pdf_path 
            FROM students 
            WHERE pdf_path LIKE '%/%'
        `);
        console.log('Students with slashes in pdf_path:');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await twonPool.end();
    }
}

checkPdfPaths();

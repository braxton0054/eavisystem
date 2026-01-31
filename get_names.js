const { Pool } = require('pg');
require('dotenv').config();

const twon = new Pool({ connectionString: process.env.TWON_DB_URL });

async function check() {
    try {
        const res = await twon.query("SELECT course_name, length(course_name) as len, fee_structure_pdf_name FROM courses WHERE course_name ILIKE '%Health Services Support%'");
        console.log(JSON.stringify(res.rows, null, 2));
    } finally {
        await twon.end();
        process.exit(0);
    }
}

check();

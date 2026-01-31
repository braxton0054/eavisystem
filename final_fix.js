const { Pool } = require('pg');
require('dotenv').config();

const twon = new Pool({ connectionString: process.env.TWON_DB_URL });

async function fix() {
    try {
        const res = await twon.query(
            "UPDATE courses SET fee_structure_pdf_name = $1 WHERE course_name = $2 RETURNING *",
            ['health_services_support_.pdf', 'Health Services Support']
        );
        if (res.rowCount > 0) {
            console.log(`✅ Successfully updated ${res.rowCount} row(s) on MAIN campus.`);
        } else {
            console.warn('⚠️  Could not find course "Health Services Support" on MAIN campus for update.');
        }
    } finally {
        await twon.end();
        process.exit(0);
    }
}

fix();

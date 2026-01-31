const { Pool } = require('pg');
require('dotenv').config();

const configs = [
    { name: 'TWON', url: process.env.TWON_DB_URL },
    { name: 'WEST', url: process.env.WEST_DB_URL }
];

async function updateYears() {
    for (const config of configs) {
        console.log(`Checking ${config.name} Database...`);
        const pool = new Pool({ connectionString: config.url, ssl: { rejectUnauthorized: false } });

        try {
            // Update existing students: /2025 -> /2026
            const resStudents = await pool.query("UPDATE students SET admission_number = REPLACE(admission_number, '/2025', '/2026') WHERE admission_number LIKE '%/2025'");
            console.log(`Updated ${resStudents.rowCount} students in ${config.name}`);

            // Update campus_settings format: replace hardcoded 2025 with {year} placeholder
            const resSettings = await pool.query("UPDATE campus_settings SET admission_number_format = REPLACE(admission_number_format, '2025', '{year}') WHERE admission_number_format LIKE '%2025%'");
            console.log(`Updated ${resSettings.rowCount} campus settings in ${config.name}`);

            // Also ensure the format is EAVI/{seq}/{year} if it wasn't already
            await pool.query("UPDATE campus_settings SET admission_number_format = 'EAVI/{seq}/{year}' WHERE admission_number_format NOT LIKE 'EAVI/%'");

        } catch (error) {
            console.error(`Error updating ${config.name}:`, error.message);
        } finally {
            await pool.end();
        }
    }
}

updateYears().then(() => {
    console.log('Database year updates complete.');
    process.exit(0);
});

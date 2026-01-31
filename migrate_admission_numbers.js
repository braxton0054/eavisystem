const { Pool } = require('pg');
require('dotenv').config();

const twonPool = new Pool({ connectionString: process.env.TWON_DB_URL, ssl: { rejectUnauthorized: false } });
const westPool = new Pool({ connectionString: process.env.WEST_DB_URL, ssl: { rejectUnauthorized: false } });

async function migrateDatabase(pool, campusName) {
    console.log(`--- Migrating ${campusName.toUpperCase()} Database ---`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update campus_settings format
        console.log('Updating admission_number_format in campus_settings...');
        const newFormat = 'EAVI/{seq}/{year}';
        await client.query(
            'UPDATE campus_settings SET admission_number_format = $1 WHERE campus_name = $2',
            [newFormat, campusName]
        );

        // 2. Fetch all students to migrate their admission numbers
        console.log('Fetching students for migration...');
        const { rows: students } = await client.query('SELECT student_id, admission_number FROM students');

        console.log(`Found ${students.length} students to migrate.`);

        for (const student of students) {
            const oldId = student.admission_number;
            // Expected format: CAMPUS-YEAR-SEQ (e.g., TWON-2025-1001)
            // or maybe some others if they were generated differently
            const parts = oldId.split('-');

            let newId = oldId;
            if (parts.length === 3) {
                const year = parts[1];
                const seq = parts[2];
                newId = `EAVI/${seq}/${year}`;
            } else if (parts.length === 2 && parts[0] === 'EAVI') {
                // Already partially migrated or different format? 
                // Skip or handle if known
                console.log(`Skipping already formatted or unknown ID: ${oldId}`);
                continue;
            } else {
                console.log(`Warning: Unexpected format for ID ${oldId}. Attempting fallback...`);
                // Fallback: if it's just a number or something else, maybe we don't know the year.
                // But usually they follow the format.
            }

            if (newId !== oldId) {
                await client.query(
                    'UPDATE students SET admission_number = $1 WHERE student_id = $2',
                    [newId, student.student_id]
                );
                // Also update admission_history if it references admission_number (not by string usually, but let's check)
                // History table uses student_id, so it's fine.
            }
        }

        await client.query('COMMIT');
        console.log(`Successfully migrated ${campusName.toUpperCase()} database.\n`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error migrating ${campusName.toUpperCase()} database:`, error);
    } finally {
        client.release();
    }
}

async function run() {
    try {
        await migrateDatabase(twonPool, 'twon');
        await migrateDatabase(westPool, 'west');
        console.log('Migration complete for all campuses.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await twonPool.end();
        await westPool.end();
    }
}

run();

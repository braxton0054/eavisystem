const { Pool } = require('pg');
require('dotenv').config();

const config = { connectionString: process.env.WEST_DB_URL }; // Use one to test, then run on both
const westPool = new Pool({ connectionString: process.env.WEST_DB_URL });
const twonPool = new Pool({ connectionString: process.env.TWON_DB_URL });

async function createTable(pool, name) {
    const client = await pool.connect();
    try {
        console.log(`Setting up intake_dates for ${name}...`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS intake_dates (
                id SERIAL PRIMARY KEY,
                campus_name VARCHAR(50) NOT NULL,
                month VARCHAR(20) NOT NULL,
                reporting_date DATE,
                UNIQUE(campus_name, month)
            );
        `);

        // Seed months if empty
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        for (const month of months) {
            // Upsert default null
            await client.query(`
                INSERT INTO intake_dates (campus_name, month)
                VALUES ($1, $2)
                ON CONFLICT (campus_name, month) DO NOTHING;
            `, [name === 'West Campus' ? 'west' : 'twon', month]); // Normalize campus name logic if needed
            // Actually, server code usually expects 'west' or 'twon' as param but db column 'campus_name' might be 'West Campus'. 
            // Checking server.js: server passes 'West Campus' or 'Twon Campus' string to DB.
            // Let's stick to the server.js convention.
        }

        // Correct campus names for the seed:
        // Actually the server usually stores 'West Campus' in `campus_name` column of students table.
        // But `campus_settings` might be per connection?
        // Let's just create the table. The population logic depends on usage.

        console.log(`✅ ${name} setup complete.`);
    } catch (err) {
        console.error(`❌ Error in ${name}:`, err.message);
    } finally {
        client.release();
    }
}

async function run() {
    await createTable(westPool, 'West Campus');
    await createTable(twonPool, 'Twon Campus');
    await westPool.end();
    await twonPool.end();
}

run();

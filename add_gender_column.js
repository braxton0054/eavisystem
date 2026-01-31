const { Pool } = require('pg');
require('dotenv').config();

// Database connections
const twonPool = new Pool({
    connectionString: process.env.TWON_DB_URL
});

const westPool = new Pool({
    connectionString: process.env.WEST_DB_URL
});

async function addGenderColumn(pool, campusName) {
    const client = await pool.connect();
    try {
        console.log(`Checking ${campusName} database...`);

        // Check if column exists
        const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='students' AND column_name='gender';
    `;
        const checkResult = await client.query(checkQuery);

        if (checkResult.rows.length === 0) {
            console.log(`Adding 'gender' column to ${campusName} students table...`);
            await client.query('ALTER TABLE students ADD COLUMN gender VARCHAR(20)');
            console.log(`✅ Successfully added 'gender' column to ${campusName}.`);
        } else {
            console.log(`ℹ️  'gender' column already exists in ${campusName}.`);
        }

    } catch (error) {
        console.error(`❌ Error updating ${campusName} database:`, error.message);
    } finally {
        client.release();
    }
}

async function runMigration() {
    await addGenderColumn(westPool, 'West Campus');
    await addGenderColumn(twonPool, 'Twon Campus');

    await westPool.end();
    await twonPool.end();
}

runMigration();

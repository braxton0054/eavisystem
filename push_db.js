const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const twonConfig = 'postgresql://neondb_owner:npg_j8sw4iKqRWgu@ep-snowy-math-ahqrtk3r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const westConfig = 'postgresql://neondb_owner:npg_qoQV16dcCxmp@ep-royal-dew-ahi5hxv4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function pushChanges() {
    const schemaPath = path.join(__dirname, 'backend', 'sql', 'unified_schema.sql');
    const sql = await fs.readFile(schemaPath, 'utf8');

    const campuses = [
        { name: 'twon', config: twonConfig },
        { name: 'west', config: westConfig }
    ];

    for (const campus of campuses) {
        console.log(`Pushing changes to ${campus.name} campus...`);
        const pool = new Pool({ connectionString: campus.config });
        const client = await pool.connect();
        try {
            // Split SQL by semicolon and execute parts, or just execute the whole block if pg supports it
            // Postgres supports multiple statements in one query call
            await client.query(sql);
            console.log(`✅ ${campus.name} campus database updated successfully.`);
        } catch (error) {
            console.error(`❌ Error updating ${campus.name} campus:`, error.message);
        } finally {
            client.release();
            await pool.end();
        }
    }
}

pushChanges().catch(console.error);

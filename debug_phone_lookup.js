const { Pool } = require('pg');
require('dotenv').config();

const twonPool = new Pool({ connectionString: process.env.TWON_DB_URL });
const westPool = new Pool({ connectionString: process.env.WEST_DB_URL });

async function findStudent() {
    const phone = '0728249135';
    console.log(`Searching for phone: "${phone}"`);

    const pools = [
        { name: 'west', pool: westPool },
        { name: 'twon', pool: twonPool }
    ];

    for (const { name, pool } of pools) {
        const client = await pool.connect();
        try {
            // Check exact match
            const resExact = await client.query('SELECT * FROM students WHERE phone_number = $1', [phone]);
            if (resExact.rows.length > 0) {
                console.log(`✅ Found EXACT match in ${name} campus:`);
                console.log(resExact.rows[0]);
            } else {
                console.log(`❌ No EXACT match in ${name} campus.`);
            }

            // Check fuzzy match (like)
            const resLike = await client.query('SELECT * FROM students WHERE phone_number LIKE $1', [`%${phone}%`]);
            if (resLike.rows.length > 0) {
                console.log(`⚠️  Found FUZZY/PARTIAL match in ${name} campus:`);
                resLike.rows.forEach(r => console.log(`   - Stored Phone: "${r.phone_number}" (ID: ${r.student_id})`));
            } else {
                console.log(`❌ No FUZZY match in ${name} campus.`);
            }

            // Check whitespace stripped
            const resStrip = await client.query("SELECT * FROM students WHERE REPLACE(phone_number, ' ', '') = $1", [phone]);
            if (resStrip.rows.length > 0) {
                console.log(`⚠️  Found STRIPPED match in ${name} campus:`);
                resStrip.rows.forEach(r => console.log(`   - Stored Phone: "${r.phone_number}"`));
            }

        } finally {
            client.release();
        }
    }
}

findStudent().then(() => {
    twonPool.end();
    westPool.end();
});

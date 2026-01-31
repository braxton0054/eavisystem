const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.WEST_DB_URL });

async function check() {
    const res = await pool.query("SELECT phone_number, length(phone_number) as len, encode(phone_number::bytea, 'hex') as hex FROM students WHERE student_id = 5");
    console.log('Record for ID 5:');
    console.log(JSON.stringify(res.rows[0], null, 2));

    const schema = await pool.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'phone_number'");
    console.log('\nColumn Schema:');
    console.log(JSON.stringify(schema.rows[0], null, 2));
}

check().then(() => pool.end());

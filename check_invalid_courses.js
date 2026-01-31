const { Pool } = require('pg');
require('dotenv').config();

const twonPool = new Pool({ connectionString: process.env.TWON_DB_URL });

async function checkInvalidCourses() {
    try {
        const result = await twonPool.query(`
            SELECT s.admission_number, s.full_name, s.course_id 
            FROM students s
            LEFT JOIN courses c ON s.course_id = c.course_id
            WHERE c.course_id IS NULL
        `);
        console.log('Students with missing courses in TWON:');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await twonPool.end();
    }
}

checkInvalidCourses();

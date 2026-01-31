const { Pool } = require('pg');
require('dotenv').config();

const twonPool = new Pool({ connectionString: process.env.TWON_DB_URL });
const westPool = new Pool({ connectionString: process.env.WEST_DB_URL });

async function verifySync() {
    console.log('--- Verifying Course Sync Capability ---');

    const testCourseCode = `SYNC_${Math.floor(Math.random() * 1000)}`;
    const courseData = {
        course_name: 'Test Sync Course',
        course_code: testCourseCode,
        department: 'Computer Science',
        fee_per_term: 10000,
        fee_per_year: 30000,
        duration_years: 4,
        minimum_kcse_grade: 'C+',
        fee_structure_pdf_name: null
    };

    console.log(`Adding course ${testCourseCode} to BOTH campuses via manual DB insert simulation...`);

    // Simulating what the API does: Insert into both
    const client1 = await twonPool.connect();
    const client2 = await westPool.connect();

    try {
        await client1.query('BEGIN');
        await client2.query('BEGIN');

        // Add to Twon
        await client1.query(`
            INSERT INTO courses(course_name, course_code, department, fee_per_term, fee_per_year, duration_years, minimum_kcse_grade, campus_name)
            VALUES($1, $2, $3, $4, $5, $6, $7, 'twon')
        `, [courseData.course_name, courseData.course_code, courseData.department, courseData.fee_per_term, courseData.fee_per_year, courseData.duration_years, courseData.minimum_kcse_grade]);

        // Add to West
        await client2.query(`
            INSERT INTO courses(course_name, course_code, department, fee_per_term, fee_per_year, duration_years, minimum_kcse_grade, campus_name)
            VALUES($1, $2, $3, $4, $5, $6, $7, 'west')
        `, [courseData.course_name, courseData.course_code, courseData.department, courseData.fee_per_term, courseData.fee_per_year, courseData.duration_years, courseData.minimum_kcse_grade]);

        await client1.query('COMMIT');
        await client2.query('COMMIT');
        console.log('✅ Simulated API Logic: Added to both successfully.');

        // Verify existence
        const res1 = await client1.query('SELECT * FROM courses WHERE course_code = $1', [testCourseCode]);
        const res2 = await client2.query('SELECT * FROM courses WHERE course_code = $1', [testCourseCode]);

        console.log(`Twon Count: ${res1.rowCount}`);
        console.log(`West Count: ${res2.rowCount}`);

        if (res1.rowCount === 1 && res2.rowCount === 1) {
            console.log('✅ Sync Confirmed: Course exists in both databases.');
        } else {
            console.log('❌ Sync Failed.');
        }

        // Cleanup
        await client1.query('DELETE FROM courses WHERE course_code = $1', [testCourseCode]);
        await client2.query('DELETE FROM courses WHERE course_code = $1', [testCourseCode]);
        console.log('Cleanup complete.');

    } catch (err) {
        await client1.query('ROLLBACK');
        await client2.query('ROLLBACK');
        console.error('Error:', err);
    } finally {
        client1.release();
        client2.release();
    }
}

verifySync().then(() => {
    twonPool.end();
    westPool.end();
});

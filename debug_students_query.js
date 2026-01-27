const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_qoQV16dcCxmp@ep-royal-dew-ahi5hxv4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function debugStudentQuery() {
    try {
        console.log('Testing student retrieval query...');

        const campus = 'west'; // Assume west for now
        const limit = 10;
        const offset = 0;

        const query = `
            SELECT s.*, c.course_name, c.department as department_name, c.fee_structure_pdf_name
            FROM students s
            LEFT JOIN courses c ON s.course_id = c.course_id
            WHERE s.campus_name = $1
            ORDER BY s.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(query, [campus, limit, offset]);
        console.log(`Success! Retrieved ${result.rows.length} students.`);
        if (result.rows.length > 0) {
            console.log('Sample student:', JSON.stringify(result.rows[0], null, 2));
        }

    } catch (error) {
        console.error('Query FAILED:', error);
    } finally {
        await pool.end();
    }
}

debugStudentQuery();

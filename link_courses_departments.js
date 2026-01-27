const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_qoQV16dcCxmp@ep-royal-dew-ahi5hxv4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function linkDepartments() {
    try {
        console.log('Linking courses to departments...');

        // Update courses to set department_id based on department name match
        const result = await pool.query(`
            UPDATE courses c
            SET department_id = d.department_id
            FROM departments d
            WHERE c.department = d.name
            AND (c.department_id IS NULL OR c.department_id != d.department_id)
            RETURNING c.course_name, c.department, d.department_id
        `);

        if (result.rowCount === 0) {
            console.log('No courses needed linking.');
        } else {
            console.log(`Updated ${result.rowCount} courses with correct department IDs.`);
            result.rows.forEach(row => {
                // console.log(`Linked '${row.course_name}' to Department ID ${row.department_id} (${row.department})`);
            });
        }

    } catch (error) {
        console.error('Error linking departments:', error);
    } finally {
        await pool.end();
    }
}

linkDepartments();

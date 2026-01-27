const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_qoQV16dcCxmp@ep-royal-dew-ahi5hxv4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function syncDepartments() {
    try {
        console.log('Checking for missing departments...');

        // Get all departments currently in the departments table
        const deptsResult = await pool.query('SELECT name FROM departments');
        const existingDeptNames = deptsResult.rows.map(r => r.name);

        // Get all unique department names referenced in the courses table
        const coursesResult = await pool.query('SELECT DISTINCT department FROM courses WHERE department IS NOT NULL');
        const courseDeptNames = coursesResult.rows.map(r => r.department);

        // Find missing departments
        const missingDepts = courseDeptNames.filter(name => !existingDeptNames.includes(name));

        if (missingDepts.length === 0) {
            console.log('No missing departments found. Database is in sync.');
        } else {
            console.log(`Found ${missingDepts.length} missing departments:`, missingDepts);

            // Insert missing departments
            for (const deptName of missingDepts) {
                // Generate a code (e.g., "Department of Health Sciences" -> "DHS")
                const code = deptName.split(' ')
                    .map(word => word[0].toUpperCase())
                    .filter(char => /[A-Z]/.test(char))
                    .join('').substring(0, 5);

                await pool.query(
                    'INSERT INTO departments (name, department_code, campus_name, created_at) VALUES ($1, $2, $3, NOW())',
                    [deptName, code, 'west'] // Assuming west campus for now, or could handle both
                );
                console.log(`Added missing department: ${deptName} (Code: ${code})`);
            }

            console.log('Successfully synced departments.');
        }

    } catch (error) {
        console.error('Error syncing departments:', error);
    } finally {
        await pool.end();
    }
}

syncDepartments();

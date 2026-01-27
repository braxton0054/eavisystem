const { Pool } = require('pg');

const twonConfig = 'postgresql://neondb_owner:npg_j8sw4iKqRWgu@ep-snowy-math-ahqrtk3r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const westConfig = 'postgresql://neondb_owner:npg_qoQV16dcCxmp@ep-royal-dew-ahi5hxv4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkCourses() {
    const campuses = [
        { name: 'twon', config: twonConfig },
        { name: 'west', config: westConfig }
    ];

    for (const campus of campuses) {
        console.log(`\n--- Courses in ${campus.name.toUpperCase()} ---`);
        const pool = new Pool({ connectionString: campus.config });
        try {
            const result = await pool.query('SELECT * FROM courses');
            console.log(`Total courses in ${campus.name}: ${result.rows.length}`);
            if (result.rows.length > 0) {
                result.rows.forEach(r => {
                    console.log(`- Course: ${r.course_name}, Dept: ${r.department}, ID: ${r.course_id}`);
                });
            } else {
                console.log(`No courses found in ${campus.name}`);
            }

        } catch (error) {
            console.error(`Error checking ${campus.name}:`, error.message);
        } finally {
            await pool.end();
        }
    }
}

checkCourses();

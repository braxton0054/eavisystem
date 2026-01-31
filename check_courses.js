const { Pool } = require('pg');
require('dotenv').config();

const twon = new Pool({ connectionString: process.env.TWON_DB_URL });
const west = new Pool({ connectionString: process.env.WEST_DB_URL });

async function check() {
    try {
        const tRes = await twon.query('SELECT course_id, course_code, course_name, fee_structure_pdf_name FROM courses ORDER BY course_name');
        const wRes = await west.query('SELECT course_id, course_code, course_name, fee_structure_pdf_name FROM courses ORDER BY course_name');

        console.log('\n=== TWON (Main) Campus Courses ===');
        tRes.rows.forEach(r => {
            console.log(`[${r.course_code || 'NO CODE'}] ${r.course_name} -> PDF: ${r.fee_structure_pdf_name || 'NONE'}`);
        });

        console.log('\n=== WEST Campus Courses ===');
        wRes.rows.forEach(r => {
            console.log(`[${r.course_code || 'NO CODE'}] ${r.course_name} -> PDF: ${r.fee_structure_pdf_name || 'NONE'}`);
        });

        // Find discrepancies
        console.log('\n=== Discrepancies (West != Main) ===');
        wRes.rows.forEach(w => {
            const t = tRes.rows.find(r => r.course_code === w.course_code || (r.course_name === w.course_name && !r.course_code));
            if (t) {
                if (w.fee_structure_pdf_name !== t.fee_structure_pdf_name) {
                    console.log(`❌ MISMATCH: ${w.course_name}`);
                    console.log(`   West: ${w.fee_structure_pdf_name}`);
                    console.log(`   Main: ${t.fee_structure_pdf_name}`);
                }
            } else {
                console.log(`⚠️  MISSING ON MAIN: ${w.course_name} [${w.course_code}]`);
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        await twon.end();
        await west.end();
        process.exit(0);
    }
}

check();

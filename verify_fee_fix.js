const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const twonPool = new Pool({ connectionString: process.env.TWON_DB_URL });
const westPool = new Pool({ connectionString: process.env.WEST_DB_URL });

const feeDir = path.join(__dirname, 'public', 'fee');

async function verifyFix() {
    console.log('--- Verifying Fee Structure Fix ---');

    // 1. Check Filesystem
    if (!fs.existsSync(feeDir)) {
        console.error('❌ Fee directory missing!');
        return;
    }

    const files = fs.readdirSync(feeDir);
    const fileSet = new Set(files);
    let fsErrors = 0;

    files.forEach(f => {
        if (f.includes(' ')) {
            console.error(`❌ File still has spaces: "${f}"`);
            fsErrors++;
        }
    });

    if (fsErrors === 0) {
        console.log('✅ All files in public/fee are clean (no spaces).');
    }

    // 2. Check Database References
    await checkDatabase(twonPool, 'Twon', fileSet);
    await checkDatabase(westPool, 'West', fileSet);

    await twonPool.end();
    await westPool.end();
}

async function checkDatabase(pool, campusName, fileSet) {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT course_name, fee_structure_pdf_name FROM courses WHERE fee_structure_pdf_name IS NOT NULL');

        let dbErrors = 0;
        res.rows.forEach(row => {
            const pdfName = row.fee_structure_pdf_name;
            if (!fileSet.has(pdfName)) {
                console.warn(`⚠️  [${campusName}] Course "${row.course_name}" points to MISSING file: "${pdfName}"`);
                dbErrors++;
            }
        });

        if (dbErrors === 0) {
            console.log(`✅ [${campusName}] All ${res.rows.length} course fee references are valid.`);
        } else {
            console.log(`⚠️  [${campusName}] Found ${dbErrors} broken fee links.`);
        }

    } catch (err) {
        console.error(`Error checking ${campusName}:`, err);
    } finally {
        client.release();
    }
}

verifyFix();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const twonPool = new Pool({ connectionString: process.env.TWON_DB_URL });
const westPool = new Pool({ connectionString: process.env.WEST_DB_URL });

const feeDir = path.join(__dirname, 'public', 'fee');

async function fixFeeFilenames() {
    try {
        if (!fs.existsSync(feeDir)) {
            console.error('Fee directory not found!');
            return;
        }

        const files = fs.readdirSync(feeDir);
        const renames = [];

        console.log('--- Scanning files ---');
        for (const file of files) {
            if (!file.endsWith('.pdf')) continue;

            // Create safe filename: lowercase, replace spaces/special chars with underscores, keep one dot for extension
            const safeName = file
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .replace(/[^a-zA-Z0-9._-]/g, '') // Remove special chars
                .replace(/_+/g, '_') // Deduplicate underscores
                .toLowerCase();

            if (file !== safeName) {
                renames.push({ oldName: file, newName: safeName });
            }
        }

        if (renames.length === 0) {
            console.log('All files are already safe. No renames needed.');
        } else {
            console.log(`Found ${renames.length} files to rename.`);
        }

        // Process renames
        for (const { oldName, newName } of renames) {
            const oldPath = path.join(feeDir, oldName);
            const newPath = path.join(feeDir, newName);

            // 1. Rename file
            try {
                if (fs.existsSync(newPath)) {
                    console.warn(`⚠️ Target file ${newName} already exists. Skipping overwrite of ${oldName}.`);
                    // We might still need to update DB if the DB points to the OLD name
                } else {
                    // Rename file
                    fs.renameSync(oldPath, newPath);
                    console.log(`✅ Renamed: "${oldName}" -> "${newName}"`);
                }
            } catch (err) {
                console.error(`❌ Failed to rename "${oldName}":`, err.message);
                continue;
            }

            // 2. Update Databases
            await updateDatabase(twonPool, 'Twon', oldName, newName);
            await updateDatabase(westPool, 'West', oldName, newName);
        }

        console.log('\n--- Migration Complete ---');

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        await twonPool.end();
        await westPool.end();
    }
}

async function updateDatabase(pool, itemsName, oldName, newName) {
    const client = await pool.connect();
    try {
        // Check if any courses reference the old name
        const checkRes = await client.query(
            'SELECT course_id, course_name FROM courses WHERE fee_structure_pdf_name = $1',
            [oldName]
        );

        if (checkRes.rows.length > 0) {
            console.log(`   Updating DB (${itemsName}): Found ${checkRes.rows.length} courses using "${oldName}"`);

            const updateRes = await client.query(
                'UPDATE courses SET fee_structure_pdf_name = $1 WHERE fee_structure_pdf_name = $2',
                [newName, oldName]
            );
            console.log(`   ✅ DB Update (${itemsName}): Updated ${updateRes.rowCount} records.`);
        }
    } catch (err) {
        console.error(`   ❌ DB Error (${itemsName}):`, err.message);
    } finally {
        client.release();
    }
}

fixFeeFilenames();

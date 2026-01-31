const { Pool } = require('pg');
const DynamicAdmissionPDFGenerator = require('./backend/utils/dynamicPdfGenerator');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const pdfGenerator = new DynamicAdmissionPDFGenerator();

async function generateStudentPDFSim(client, campus, admissionNumber) {
    try {
        console.log(`Step 1: Fetching student ${admissionNumber} for campus ${campus}`);
        const studentQuery = `
      SELECT s.*, c.course_name, c.department, c.duration_years, c.fee_per_term, c.fee_per_year
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE s.admission_number = $1 AND s.campus_name = $2
    `;
        const result = await client.query(studentQuery, [admissionNumber, campus]);

        if (result.rows.length === 0) {
            console.error('Student not found in DB');
            return null;
        }

        const student = result.rows[0];
        const filename = student.pdf_path || `${student.full_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;

        const rootDir = process.cwd();
        const baseDir = process.env.VERCEL
            ? path.join('/tmp', 'admission')
            : path.join(rootDir, 'backend', 'admission');

        const filePath = path.join(baseDir, filename);

        if (fs.existsSync(filePath)) {
            console.log(`File exists at ${filePath}`);
            return filePath;
        }

        console.log(`Step 2: Fetching campus settings`);
        const settingsResult = await client.query('SELECT * FROM campus_settings WHERE campus_name = $1', [campus]);
        const settings = settingsResult.rows[0] || {};

        console.log(`Step 3: Determining reporting date`);
        let reportingDateStr = student.reporting_date ? new Date(student.reporting_date).toLocaleDateString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

        const term = parseInt(student.term);
        if (term === 1 && settings.reporting_date_term1) reportingDateStr = new Date(settings.reporting_date_term1).toLocaleDateString();
        else if (term === 2 && settings.reporting_date_term2) reportingDateStr = new Date(settings.reporting_date_term2).toLocaleDateString();
        else if (term === 3 && settings.reporting_date_term3) reportingDateStr = new Date(settings.reporting_date_term3).toLocaleDateString();

        console.log(`Step 4: Generating PDF bytes`);
        const pdfBytes = await pdfGenerator.generateAdmissionLetter({
            admission_number: admissionNumber,
            student_name: student.full_name,
            reporting_date: reportingDateStr,
            fee_balance: student.fee_balance_per_term || student.fee_per_term || 0
        }, {
            course_name: student.course_name,
            department_name: student.department || student.department_name, // student.department from query
            duration: `${student.duration_years} year${student.duration_years > 1 ? 's' : ''}`,
            fee_per_term: student.fee_per_term,
            fee_per_year: student.fee_per_year,
            total_fee: student.fee_per_year * student.duration_years
        });

        console.log(`Step 5: Saving PDF`);
        const sanitizedAdm = admissionNumber.replace(/\//g, '_');
        const generatedFilename = `admission_${sanitizedAdm}_${Date.now()}.pdf`;
        const generatedPath = await pdfGenerator.savePDF(pdfBytes, generatedFilename);

        console.log(`Step 6: Updating DB`);
        await client.query(
            'UPDATE students SET pdf_path = $1 WHERE admission_number = $2 AND campus_name = $3',
            [generatedFilename, admissionNumber, campus]
        );

        return generatedPath;
    } catch (err) {
        console.error('ERROR in sim:', err);
        throw err;
    }
}

const pool = new Pool({ connectionString: process.env.TWON_DB_URL });

(async () => {
    try {
        const client = await pool.connect();
        const testId = 'EAVI/1009/2026';
        const result = await generateStudentPDFSim(client, 'twon', testId);
        console.log('Final Result:', result);
        client.release();
    } catch (err) {
        console.error('Final ERROR:', err);
    } finally {
        await pool.end();
    }
})();

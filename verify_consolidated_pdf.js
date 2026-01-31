const DynamicAdmissionPDFGenerator = require('./backend/utils/dynamicPdfGenerator');
const path = require('path');
const fs = require('fs').promises;
const fs_sync = require('fs');

async function verifyConsolidatedPDF() {
    console.log('--- Starting Verification of Consolidated PDF ---');
    const generator = new DynamicAdmissionPDFGenerator();

    // 1. Mock Data
    const studentData = {
        admission_number: 'VERIFY/2026/001',
        student_name: 'Consolidation Test Student',
        reporting_date: 'February 10, 2026'
    };

    const courseData = {
        course_name: 'Medical Laboratory Technology',
        department_name: 'Health Sciences',
        fee_per_term: '25,000',
        fee_per_year: '75,000',
        duration_years: 3,
        // Use an actual file found in public/fee
        fee_structure_pdf_name: 'medical_lab.pdf'
    };

    try {
        // 2. Clear previous test if exists
        const testFilename = 'verify_consolidation_test.pdf';
        const testPath = path.join(__dirname, 'backend', 'generated_pdfs', testFilename);
        if (fs_sync.existsSync(testPath)) {
            await fs.unlink(testPath);
            console.log('Cleanup: Deleted old test PDF');
        }

        // 3. Generate
        console.log(`Generating consolidated PDF with fee: ${courseData.fee_structure_pdf_name}...`);
        const pdfBytes = await generator.generateFullAdmissionPackage(studentData, courseData);

        // 4. Save
        const resultPath = await generator.savePDF(pdfBytes, testFilename);
        console.log('✅ PDF generated successfully at:', resultPath);

        // 5. Check if it exists and has content
        const stats = fs_sync.statSync(resultPath);
        console.log(`✅ File size: ${(stats.size / 1024).toFixed(2)} KB`);

        if (stats.size > 100000) { // Usually 4 pages of content with images/embedded PDF will be > 100KB
            console.log('✅ PDF size suggests multiple pages (likely consolidated)');
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

verifyConsolidatedPDF();

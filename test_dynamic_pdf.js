const DynamicAdmissionPDFGenerator = require('./backend/utils/dynamicPdfGenerator');
const path = require('path');
const fs = require('fs');

async function testDynamicPDF() {
    const generator = new DynamicAdmissionPDFGenerator();

    const studentData = {
        student_name: 'John Doe',
        admission_number: 'TEST-2026-001',
        email: 'john.doe@example.com',
        phone: '+254712345678',
        campus: 'West Campus',
        reporting_date: 'February 15, 2026'
    };

    const courseData = {
        course_name: 'Bachelor of Science in Information Technology',
        department_name: 'School of Computing and Informatics',
        duration: '4 Years',
        fee_per_term: 45000,
        total_fee: 360000
    };

    console.log('Generating dynamic PDF...');
    try {
        const pdfBytes = await generator.generateAdmissionLetter(studentData, courseData);
        const filename = `test_admission_${Date.now()}.pdf`;
        const filePath = await generator.savePDF(pdfBytes, filename);

        console.log('PDF generated successfully!');
        console.log('File path:', filePath);

        if (fs.existsSync(filePath)) {
            console.log('SUCCESS: PDF file exists on disk.');
            console.log('Size:', fs.statSync(filePath).size, 'bytes');
        } else {
            console.log('FAILURE: PDF file was not found after saving.');
        }
    } catch (error) {
        console.error('ERROR during PDF generation:', error);
    }
}

testDynamicPDF();

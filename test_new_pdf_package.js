const DynamicAdmissionPDFGenerator = require('./backend/utils/dynamicPdfGenerator');
const fs = require('fs').promises;
const path = require('path');

async function testPdfGeneration() {
    const generator = new DynamicAdmissionPDFGenerator();

    const studentData = {
        student_name: 'John Doe Testing',
        admission_number: 'TWON-2026-1005',
        reporting_date: '02/02/2026',
        fee_balance: '15000.00'
    };

    const courseData = {
        course_name: 'Diploma in Information Communication Technology',
        fee_per_term: '15000.00',
        fee_per_year: '45000.00',
        total_fee: '135000.00'
    };

    const institutionData = {
        equity_acc: '0470292838961',
        kcb_acc: '1115207350',
        paybill: '257557'
    };

    console.log('Generating dynamic admission package...');
    try {
        const pdfBytes = await generator.generateFullAdmissionPackage(studentData, courseData, institutionData);
        const filename = `test_admission_package_${Date.now()}.pdf`;
        const filePath = await generator.savePDF(pdfBytes, filename);
        console.log(`PDF generated successfully at: ${filePath}`);
    } catch (error) {
        console.error('Failed to generate PDF:', error);
    }
}

testPdfGeneration();

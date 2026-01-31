const DynamicAdmissionPDFGenerator = require('./backend/utils/dynamicPdfGenerator');
const fs = require('fs').promises;
const path = require('path');

async function verifyMedicalLogic() {
    const generator = new DynamicAdmissionPDFGenerator();

    const studentData = {
        student_name: 'TEST STUDENT',
        admission_number: 'EAVI/1234/2026',
        reporting_date: '02/02/2026',
        fee_balance: '15000.00'
    };

    const medicalCourse = {
        course_name: 'Diploma in Nursing',
        department_name: 'Health Sciences',
        fee_per_term: '25000.00',
        fee_per_year: '75000.00'
    };

    const nonMedicalCourse = {
        course_name: 'Certificate in Accounting',
        department_name: 'Business',
        fee_per_term: '12000.00',
        fee_per_year: '36000.00'
    };

    const institutionData = {
        equity_acc: '0470292838961',
        kcb_acc: '1115207350',
        paybill: '257557'
    };

    try {
        console.log('Generating Medical PDF...');
        const medPdf = await generator.generateFullAdmissionPackage(studentData, medicalCourse, institutionData);
        const medPath = await generator.savePDF(medPdf, 'verify_medical_TRUE.pdf');
        console.log(`Medical PDF generated: ${medPath}`);

        console.log('Generating Non-Medical PDF...');
        const nonMedPdf = await generator.generateFullAdmissionPackage(studentData, nonMedicalCourse, institutionData);
        const nonMedPath = await generator.savePDF(nonMedPdf, 'verify_medical_FALSE.pdf');
        console.log(`Non-Medical PDF generated: ${nonMedPath}`);

        console.log('\nVerification completed. Please check the generated PDFs in backend/generated_pdfs/');
    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verifyMedicalLogic();

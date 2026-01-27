require('dotenv').config();
const emailService = require('./backend/utils/emailService');
const path = require('path');

async function testEmail() {
    console.log('Testing email configuration...');
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Email Pass:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');

    // Test student data
    const testStudent = {
        full_name: 'Braxton Kipchumba',
        email: 'braxtonkipchumba3@gmail.com', // Test recipient
        admission_number: 'TWON-2026-1001',
        course_name: 'Diploma in Business Management',
        campus_name: 'twon'
    };

    // Create a dummy PDF path (you can use an existing one if available)
    const admissionPdfPath = path.join(__dirname, 'backend', 'generated_pdfs', 'sample.pdf');
    const feePdfName = 'fee_IT_2026.pdf'; // Example fee structure name

    console.log('\nSending test email to:', testStudent.email);

    const result = await emailService.sendSubmissionEmail(
        testStudent,
        admissionPdfPath,
        feePdfName
    );

    if (result.success) {
        console.log('\n✅ Email sent successfully!');
        console.log('Message ID:', result.messageId);
    } else {
        console.log('\n❌ Email failed to send');
        console.log('Error:', result.error);
    }
}

testEmail().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});

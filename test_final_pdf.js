const PDFTemplateFiller = require('./backend/utils/pdfTemplateFiller');
const path = require('path');
const fs = require('fs');

async function testFinal() {
    const filler = new PDFTemplateFiller();
    const testData = {
        student_name: 'Antigravity Test Student',
        admission_number: 'TEST-2026-999',
        course_name: 'Master of Advanced Agentic Coding',
        reporting_date: 'February 10, 2026',
        issue_date: new Date().toLocaleDateString(),
        total_fee: '50,000'
    };

    try {
        console.log('Generating PDF...');
        const pdfPath = await filler.fillAndSaveTemplate(testData);
        console.log('✅ PDF generated at:', pdfPath);

        const filename = path.basename(pdfPath);
        if (filename === 'Antigravity_Test_Student.pdf') {
            console.log('✅ Filename is correct!');
        } else {
            console.log('❌ Filename is incorrect:', filename);
        }

        if (pdfPath.includes('admission')) {
            console.log('✅ Saved in admission folder!');
        } else {
            console.log('❌ Saved in wrong folder:', pdfPath);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testFinal();

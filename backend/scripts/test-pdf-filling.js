const PDFTemplateFiller = require('../utils/pdfTemplateFiller');

async function testPDFFilling() {
    try {
        console.log('🚀 Testing PDF Template Filling...');
        
        const pdfFiller = new PDFTemplateFiller();
        
        // Sample student data
        const sampleStudent = {
            student_name: 'John Doe',
            admission_number: 'TWON2024001',
            course_name: 'Bachelor of Computer Science',
            department: 'Computer Science',
            campus: 'twon',
            email: 'john.doe@email.com',
            phone: '+254-712-345678',
            date_of_birth: '2000-01-15',
            location: 'Nairobi, Kenya',
            kcse_grade: 'B+',
            admission_date: '2024-01-15',
            reporting_date: '2024-01-22',
            duration: '4 years',
            fee_per_term: '$500',
            total_fee: '$6000',
            issue_date: '2024-01-15'
        };
        
        console.log('📝 Sample student data prepared');
        
        // Fill and save the template
        const pdfPath = await pdfFiller.fillAndSaveTemplate(sampleStudent);
        
        console.log('✅ PDF generated successfully!');
        console.log(`📄 PDF saved to: ${pdfPath}`);
        console.log('🔍 Check the backend/generated_pdfs folder for the output');
        
        // Show placeholder mappings for reference
        console.log('\n📍 Current placeholder positions (adjust these based on your template):');
        const mappings = pdfFiller.getPlaceholderMappings();
        Object.entries(mappings).forEach(([placeholder, config]) => {
            console.log(`   ${placeholder}: x=${config.position.x}, y=${config.position.y}`);
        });
        
    } catch (error) {
        console.error('💥 Error testing PDF filling:', error.message);
    }
}

// Run the test
testPDFFilling();

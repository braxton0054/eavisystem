const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function analyzePDFTemplate() {
    try {
        console.log('🔍 Analyzing admission_template.pdf...');
        
        const templatePath = path.join(__dirname, '..', 'templates', 'admission_template.pdf');
        
        // Read the template PDF
        const existingPdfBytes = await fs.readFile(templatePath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        
        // Get the first page
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        
        console.log(`📄 PDF Info:`);
        console.log(`   - Pages: ${pages.length}`);
        console.log(`   - Page size: ${firstPage.getSize().width} x ${firstPage.getSize().height}`);
        
        // Try to extract text content (this is limited with pdf-lib)
        console.log('\n⚠️ Note: pdf-lib has limited text extraction capabilities');
        console.log('🔍 For full text analysis, you might need a more advanced PDF library');
        
        // Create a visual analysis by drawing a grid
        const { width, height } = firstPage.getSize();
        console.log(`\n📏 Page Dimensions:`);
        console.log(`   - Width: ${width} points`);
        console.log(`   - Height: ${height} points`);
        
        // Create a grid overlay to help identify positions
        const gridSpacing = 50;
        console.log(`\n📐 Grid Reference (every ${gridSpacing} points):`);
        
        for (let y = height; y >= 0; y -= gridSpacing) {
            for (let x = 0; x <= width; x += gridSpacing) {
                console.log(`   Position: (${x}, ${y})`);
            }
        }
        
        // Save a version with grid overlay for visual reference
        const gridPdfDoc = await PDFDocument.load(existingPdfBytes);
        const gridPage = gridPdfDoc.getPages()[0];
        
        // Draw grid lines
        const { rgb } = require('pdf-lib');
        const font = await gridPdfDoc.embedFont(require('pdf-lib').StandardFonts.Helvetica);
        
        // Draw vertical lines
        for (let x = 0; x <= width; x += gridSpacing) {
            gridPage.drawLine({
                start: { x, y: 0 },
                end: { x, y: height },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8)
            });
            
            // Add x-coordinate labels
            if (x % 100 === 0) {
                gridPage.drawText(x.toString(), {
                    x: x - 10,
                    y: height - 20,
                    size: 8,
                    font: font,
                    color: rgb(0.5, 0.5, 0.5)
                });
            }
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= height; y += gridSpacing) {
            gridPage.drawLine({
                start: { x: 0, y },
                end: { x: width, y },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8)
            });
            
            // Add y-coordinate labels
            if (y % 100 === 0) {
                gridPage.drawText(y.toString(), {
                    x: 10,
                    y: y - 5,
                    size: 8,
                    font: font,
                    color: rgb(0.5, 0.5, 0.5)
                });
            }
        }
        
        // Save the grid overlay
        const gridPdfBytes = await gridPdfDoc.save();
        const gridPath = path.join(__dirname, '..', 'generated_pdfs', 'template_with_grid.pdf');
        await fs.writeFile(gridPath, gridPdfBytes);
        
        console.log(`\n✅ Grid overlay created: ${gridPath}`);
        console.log('🔍 Open this file to see coordinate positions on your template');
        
        console.log('\n🎯 Next Steps:');
        console.log('1. Open template_with_grid.pdf to see coordinate positions');
        console.log('2. Look for placeholder text in your original admission_template.pdf');
        console.log('3. Note the coordinates where placeholders appear');
        console.log('4. Update the placeholder mappings in pdfTemplateFiller.js');
        
        console.log('\n📝 Common placeholder patterns to look for:');
        console.log('   - {{STUDENT_NAME}} or [Student Name]');
        console.log('   - {{ADMISSION_NUMBER}} or [Admission No.]');
        console.log('   - {{COURSE}} or [Course Name]');
        console.log('   - Any text surrounded by {{}} or []');
        
    } catch (error) {
        console.error('💥 Error analyzing PDF template:', error.message);
    }
}

analyzePDFTemplate();

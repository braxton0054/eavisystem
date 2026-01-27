const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

class PlaceholderPositionHelper {
    constructor() {
        this.templatePath = path.join(__dirname, '..', 'templates', 'admission_template.pdf');
    }

    /**
     * Create a visual guide showing placeholder positions on the template
     * This helps you see where to position the text based on your template
     */
    async createPositionGuide() {
        try {
            // Read the template PDF
            const existingPdfBytes = await fs.readFile(this.templatePath);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            
            // Get the first page
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            
            // Load font
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            
            // Common placeholder positions (you can adjust these)
            const placeholders = [
                { name: 'STUDENT_NAME', x: 200, y: 450 },
                { name: 'ADMISSION_NUMBER', x: 200, y: 420 },
                { name: 'COURSE_NAME', x: 200, y: 390 },
                { name: 'DEPARTMENT', x: 200, y: 360 },
                { name: 'CAMPUS', x: 200, y: 330 },
                { name: 'EMAIL', x: 200, y: 280 },
                { name: 'PHONE', x: 200, y: 250 },
                { name: 'DATE_OF_BIRTH', x: 200, y: 220 },
                { name: 'LOCATION', x: 200, y: 190 },
                { name: 'KCSE_GRADE', x: 200, y: 140 },
                { name: 'ADMISSION_DATE', x: 200, y: 110 },
                { name: 'REPORTING_DATE', x: 200, y: 80 },
                { name: 'DURATION', x: 450, y: 450 },
                { name: 'FEE_PER_TERM', x: 450, y: 420 },
                { name: 'TOTAL_FEE', x: 450, y: 390 },
                { name: 'ISSUE_DATE', x: 450, y: 150 }
            ];
            
            // Draw placeholder indicators
            placeholders.forEach((placeholder, index) => {
                // Draw a small rectangle to mark the position
                const rectSize = 80;
                firstPage.drawRectangle({
                    x: placeholder.x - 5,
                    y: placeholder.y - 5,
                    width: rectSize,
                    height: 20,
                    borderColor: rgb(1, 0, 0), // Red border
                    borderWidth: 1
                });
                
                // Draw the placeholder name
                firstPage.drawText(placeholder.name, {
                    x: placeholder.x,
                    y: placeholder.y + 2,
                    size: 8,
                    font: font,
                    color: rgb(1, 0, 0) // Red text
                });
                
                // Draw coordinates
                firstPage.drawText(`(${placeholder.x}, ${placeholder.y})`, {
                    x: placeholder.x,
                    y: placeholder.y - 10,
                    size: 6,
                    font: font,
                    color: rgb(0.5, 0.5, 0.5) // Gray text
                });
            });
            
            // Add title
            firstPage.drawText('Placeholder Position Guide', {
                x: 200,
                y: 550,
                size: 16,
                font: font,
                color: rgb(0, 0, 0)
            });
            
            firstPage.drawText('Adjust the x,y coordinates in pdfTemplateFiller.js based on your template layout', {
                x: 100,
                y: 530,
                size: 10,
                font: font,
                color: rgb(0.5, 0.5, 0.5)
            });
            
            // Save the guide
            const pdfBytes = await pdfDoc.save();
            const guidePath = path.join(__dirname, '..', 'generated_pdfs', 'placeholder_position_guide.pdf');
            await fs.writeFile(guidePath, pdfBytes);
            
            console.log('✅ Placeholder position guide created!');
            console.log(`📄 Guide saved to: ${guidePath}`);
            console.log('🔍 Open this file to see where the placeholders will be positioned');
            
            return guidePath;
            
        } catch (error) {
            console.error('Error creating position guide:', error);
            throw error;
        }
    }

    /**
     * Generate a configuration file with current placeholder positions
     */
    async generateConfigFile() {
        const config = {
            placeholders: {
                'STUDENT_NAME': { x: 200, y: 450, size: 14, bold: true },
                'ADMISSION_NUMBER': { x: 200, y: 420, size: 12, bold: false },
                'COURSE_NAME': { x: 200, y: 390, size: 12, bold: false },
                'DEPARTMENT': { x: 200, y: 360, size: 12, bold: false },
                'CAMPUS': { x: 200, y: 330, size: 12, bold: false },
                'EMAIL': { x: 200, y: 280, size: 12, bold: false },
                'PHONE': { x: 200, y: 250, size: 12, bold: false },
                'DATE_OF_BIRTH': { x: 200, y: 220, size: 12, bold: false },
                'LOCATION': { x: 200, y: 190, size: 12, bold: false },
                'KCSE_GRADE': { x: 200, y: 140, size: 12, bold: false },
                'ADMISSION_DATE': { x: 200, y: 110, size: 12, bold: false },
                'REPORTING_DATE': { x: 200, y: 80, size: 12, bold: false },
                'DURATION': { x: 450, y: 450, size: 12, bold: false },
                'FEE_PER_TERM': { x: 450, y: 420, size: 12, bold: false },
                'TOTAL_FEE': { x: 450, y: 390, size: 12, bold: false },
                'ISSUE_DATE': { x: 450, y: 150, size: 10, bold: false }
            }
        };
        
        const configPath = path.join(__dirname, '..', 'config', 'placeholder-config.json');
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        
        console.log('✅ Placeholder configuration file created!');
        console.log(`📄 Config saved to: ${configPath}`);
        
        return configPath;
    }
}

module.exports = PlaceholderPositionHelper;

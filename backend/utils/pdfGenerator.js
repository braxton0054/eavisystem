const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

class AdmissionPDFGenerator {
    constructor() {
        this.templatePath = path.join(__dirname, '..', 'templates', 'admission_template.pdf');
        this.outputPath = path.join(__dirname, '..', 'generated_pdfs');
    }

    /**
     * Generate admission letter PDF for a student
     * @param {Object} studentData - Student information
     * @param {Object} courseData - Course information
     * @param {Object} institutionData - Institution information
     * @returns {Promise<Buffer>} PDF buffer
     */
    async generateAdmissionLetter(studentData, courseData, institutionData = {}) {
        try {
            // Read the template PDF
            const existingPdfBytes = await fs.readFile(this.templatePath);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            
            // Get the first page (assuming template has one page)
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            
            // Load standard fonts
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            
            // Default institution data
            const defaultInstitution = {
                name: 'East Africa Vision Institute',
                address: '123 Education Street, Nairobi, Kenya',
                phone: '+254-123-456789',
                email: 'info@eavi.edu',
                website: 'www.eavi.edu',
                ...institutionData
            };
            
            // Fill in the template with student data
            await this.fillTemplate(firstPage, font, boldFont, {
                ...studentData,
                ...courseData,
                ...defaultInstitution
            });
            
            // Save the PDF
            const pdfBytes = await pdfDoc.save();
            
            return pdfBytes;
            
        } catch (error) {
            console.error('Error generating admission PDF:', error);
            throw new Error('Failed to generate admission letter');
        }
    }

    /**
     * Fill the template with data
     * @param {PDFPage} page - PDF page to fill
     * @param {PDFFont} font - Regular font
     * @param {PDFFont} boldFont - Bold font
     * @param {Object} data - Data to fill
     */
    async fillTemplate(page, font, boldFont, data) {
        const { width, height } = page.getSize();
        
        // Define placeholder positions (these need to be adjusted based on your template)
        const placeholders = {
            // Student Information
            studentName: { x: 200, y: height - 200, font: boldFont, size: 14 },
            admissionNumber: { x: 200, y: height - 230, font: font, size: 12 },
            courseName: { x: 200, y: height - 260, font: font, size: 12 },
            department: { x: 200, y: height - 290, font: font, size: 12 },
            campus: { x: 200, y: height - 320, font: font, size: 12 },
            
            // Personal Details
            email: { x: 200, y: height - 380, font: font, size: 12 },
            phone: { x: 200, y: height - 410, font: font, size: 12 },
            dateOfBirth: { x: 200, y: height - 440, font: font, size: 12 },
            location: { x: 200, y: height - 470, font: font, size: 12 },
            
            // Academic Information
            kcseGrade: { x: 200, y: height - 520, font: font, size: 12 },
            admissionDate: { x: 200, y: height - 550, font: font, size: 12 },
            reportingDate: { x: 200, y: height - 580, font: font, size: 12 },
            
            // Course Details
            duration: { x: 200, y: height - 640, font: font, size: 12 },
            feePerTerm: { x: 200, y: height - 670, font: font, size: 12 },
            totalFee: { x: 200, y: height - 700, font: font, size: 12 },
            
            // Dates
            issueDate: { x: 450, y: height - 750, font: font, size: 10 }
        };
        
        // Fill each placeholder
        for (const [key, placeholder] of Object.entries(placeholders)) {
            const value = data[key] || '';
            if (value) {
                page.drawText(value.toString(), {
                    x: placeholder.x,
                    y: placeholder.y,
                    size: placeholder.size,
                    font: placeholder.font,
                    color: rgb(0, 0, 0)
                });
            }
        }
        
        // Add institution header if not in template
        await this.addInstitutionHeader(page, boldFont, font, data);
        
        // Add signature section
        await this.addSignatureSection(page, font, data);
    }

    /**
     * Add institution header
     */
    async addInstitutionHeader(page, boldFont, font, data) {
        const { width, height } = page.getSize();
        
        // Institution name
        page.drawText(data.name || 'East Africa Vision Institute', {
            x: width / 2 - 150,
            y: height - 50,
            size: 18,
            font: boldFont,
            color: rgb(0, 0, 0)
        });
        
        // Address
        page.drawText(data.address || '123 Education Street, Nairobi, Kenya', {
            x: width / 2 - 120,
            y: height - 75,
            size: 10,
            font: font,
            color: rgb(0, 0, 0)
        });
        
        // Contact info
        page.drawText(`Phone: ${data.phone || '+254-123-456789'} | Email: ${data.email || 'info@eavi.edu'}`, {
            x: width / 2 - 140,
            y: height - 95,
            size: 9,
            font: font,
            color: rgb(0, 0, 0)
        });
    }

    /**
     * Add signature section
     */
    async addSignatureSection(page, font, data) {
        const { width, height } = page.getSize();
        
        // Signature line
        page.drawLine({
            start: { x: 100, y: 100 },
            end: { x: 250, y: 100 },
            thickness: 1,
            color: rgb(0, 0, 0)
        });
        
        // Signature text
        page.drawText('Principal Signature', {
            x: 120,
            y: 85,
            size: 10,
            font: font,
            color: rgb(0, 0, 0)
        });
        
        // Date line
        page.drawLine({
            start: { x: 400, y: 100 },
            end: { x: 550, y: 100 },
            thickness: 1,
            color: rgb(0, 0, 0)
        });
        
        // Date text
        page.drawText('Date', {
            x: 460,
            y: 85,
            size: 10,
            font: font,
            color: rgb(0, 0, 0)
        });
    }

    /**
     * Save PDF to file
     * @param {Buffer} pdfBytes - PDF buffer
     * @param {string} filename - Filename
     * @returns {Promise<string>} File path
     */
    async savePDF(pdfBytes, filename) {
        try {
            // Ensure output directory exists
            await fs.mkdir(this.outputPath, { recursive: true });
            
            const filePath = path.join(this.outputPath, filename);
            await fs.writeFile(filePath, pdfBytes);
            
            return filePath;
        } catch (error) {
            console.error('Error saving PDF:', error);
            throw new Error('Failed to save PDF');
        }
    }

    /**
     * Generate admission letter and save to file
     * @param {Object} studentData - Student information
     * @param {Object} courseData - Course information
     * @param {Object} institutionData - Institution information
     * @returns {Promise<string>} File path
     */
    async generateAndSaveAdmissionLetter(studentData, courseData, institutionData = {}) {
        const pdfBytes = await this.generateAdmissionLetter(studentData, courseData, institutionData);
        
        // Generate filename
        const admissionNumber = studentData.admission_number || 'UNKNOWN';
        const filename = `admission_letter_${admissionNumber}_${Date.now()}.pdf`;
        
        return await this.savePDF(pdfBytes, filename);
    }
}

module.exports = AdmissionPDFGenerator;

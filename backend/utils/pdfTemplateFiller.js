const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

class PDFTemplateFiller {
    constructor() {
        this.templatePath = path.join(__dirname, '..', 'templates', 'admission_template.pdf');

        // Use /tmp for output on Vercel (read-only filesystem elsewhere)
        if (process.env.VERCEL) {
            this.outputPath = path.join('/tmp', 'admission');
        } else {
            this.outputPath = path.join(__dirname, '..', 'admission');
        }
    }

    /**
     * Fill admission template with student data using form fields
     * @param {Object} studentData - Student information
     * @returns {Promise<Buffer>} Filled PDF buffer
     */
    async fillAdmissionTemplate(studentData) {
        try {
            // Read the template PDF
            const existingPdfBytes = await fs.readFile(this.templatePath);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);

            // Get the form
            const form = pdfDoc.getForm();

            // Map student data to form fields
            // Fields found in inspection:
            // text_1inxs, text_7ijwa, text_8utet, text_15n -> Name
            // text_3ipjg, text_14bkqt -> Admission Number
            // text_2zyxu, text_9ynpv -> Course Name
            // text_5khcd -> Reporting Date
            // text_6shix, text_10xfmq -> Issue Date
            // text_12wzbr -> Total Fees

            const fieldMappings = {
                // Name fields
                'text_1inxs': studentData.student_name,
                'text_7ijwa': studentData.student_name,
                'text_8utet': studentData.student_name,
                'text_15n': studentData.student_name,

                // Admission number fields
                'text_3ipjg': studentData.admission_number,
                'text_14bkqt': studentData.admission_number,

                // Course fields
                'text_2zyxu': studentData.course_name,
                'text_9ynpv': studentData.course_name,

                // Date/Other fields
                'text_5khcd': studentData.reporting_date,
                'text_6shix': studentData.issue_date,
                'text_10xfmq': studentData.issue_date,
                'text_11uyvc': studentData.fee_balance || '0', // If available
                'text_12wzbr': studentData.total_fee || '0'
            };

            // Fill each field
            for (const [fieldName, value] of Object.entries(fieldMappings)) {
                if (value) {
                    try {
                        const field = form.getTextField(fieldName);
                        if (field) {
                            field.setText(value.toString());
                        }
                    } catch (e) {
                        console.warn(`Could not fill field ${fieldName}: ${e.message}`);
                    }
                }
            }

            // Flatten the form to make it non-editable (optional but recommended for letters)
            form.flatten();

            // Save the PDF
            const pdfBytes = await pdfDoc.save();
            return pdfBytes;

        } catch (error) {
            console.error('Error filling PDF template:', error);
            throw new Error('Failed to fill admission template: ' + error.message);
        }
    }

    /**
     * Save filled PDF to file
     * @param {Buffer} pdfBytes - PDF buffer
     * @param {string} filename - Filename
     * @returns {Promise<string>} File path
     */
    async saveFilledPDF(pdfBytes, filename) {
        try {
            // Ensure output directory 'admission' exists
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
     * Fill template and save to file
     * @param {Object} studentData - Student information
     * @returns {Promise<string>} File path
     */
    async fillAndSaveTemplate(studentData) {
        const pdfBytes = await this.fillAdmissionTemplate(studentData);

        // Generate filename using student name as requested
        // Clean name for filesystem
        const safeName = (studentData.student_name || 'STUDENT').replace(/[^a-z0-9]/gi, '_');
        const filename = `${safeName}.pdf`;

        return await this.saveFilledPDF(pdfBytes, filename);
    }
}

module.exports = PDFTemplateFiller;

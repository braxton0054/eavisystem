const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function createDebugPdf() {
    const templatePath = path.join(__dirname, 'backend', 'templates', 'admission_template.pdf');
    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    fields.forEach(field => {
        if (field.constructor.name === 'PDFTextField') {
            try {
                field.setText(field.getName());
            } catch (e) {
                console.log(`Could not set text for ${field.getName()}: ${e.message}`);
            }
        }
    });

    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(__dirname, 'backend', 'generated_pdfs', 'template_debug.pdf');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, pdfBytes);
    console.log('Debug PDF created at:', outputPath);
}

createDebugPdf().catch(console.error);

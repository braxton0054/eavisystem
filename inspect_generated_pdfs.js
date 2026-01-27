const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const fss = require('fs');

async function inspectGenerated(filename, logStream) {
    const filePath = path.join(__dirname, 'backend', 'generated_pdfs', filename);
    const existingPdfBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    logStream.write(`Inspecting ${filename}:\n`);
    fields.forEach(field => {
        if (field.constructor.name === 'PDFTextField') {
            logStream.write(`- ${field.getName()}: ${field.getText()}\n`);
        }
    });
    logStream.write('\n');
}

async function main() {
    const logStream = fss.createWriteStream('generated_inspection_utf8.log');
    const files = [
        'admission_letter_TWON2024001_1769478843240.pdf',
        'admission_letter_WEST-2025-2001_1769478993020.pdf'
    ];
    for (const f of files) {
        await inspectGenerated(f, logStream).catch(e => logStream.write(`Error on ${f}: ${e.message}\n`));
    }
    logStream.end();
}

main();

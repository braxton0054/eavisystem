const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function inspectPdf() {
    const templatePath = path.join(__dirname, 'backend', 'templates', 'admission_template.pdf');
    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    let log = `PDF Size: ${width}x${height}\n`;

    const form = pdfDoc.getForm();
    const fields = form.getFields();
    log += `Found ${fields.length} form fields:\n`;

    fields.forEach(field => {
        const type = field.constructor.name;
        const name = field.getName();
        log += `- Name: ${name}, Type: ${type}\n`;

        // Try to get widgets to find positions
        try {
            const widgets = field.acroField.getWidgets();
            widgets.forEach((widget, i) => {
                const rect = widget.getRectangle();
                log += `  Widget ${i}: x=${rect.x}, y=${rect.y}, w=${rect.width}, h=${rect.height}\n`;
            });
        } catch (e) {
            log += `  Could not get position: ${e.message}\n`;
        }
    });

    await fs.writeFile('pdf_inspection.log', log);
    console.log('Inspection complete. check pdf_inspection.log');
}

inspectPdf().catch(console.error);

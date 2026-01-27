const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function inspectPdf() {
    const templatePath = path.join(__dirname, 'backend', 'templates', 'admission_template.pdf');
    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    let log = '';
    fields.forEach(field => {
        const type = field.constructor.name;
        const name = field.getName();
        // Check for tooltip (TU in PDF spec)
        const acroField = field.acroField;
        const tooltip = acroField.getDU() || acroField.getTU();

        log += `- Name: ${name}, Type: ${type}, Tooltip: ${tooltip || 'None'}\n`;

        try {
            const widgets = acroField.getWidgets();
            widgets.forEach((widget, i) => {
                const rect = widget.getRectangle();
                log += `  Widget ${i}: x=${rect.x}, y=${rect.y}, w=${rect.width}, h=${rect.height}\n`;
            });
        } catch (e) { }
    });

    await fs.writeFile('pdf_inspection_v2.log', log);
    console.log('Inspection complete. check pdf_inspection_v2.log');
}

inspectPdf().catch(console.error);

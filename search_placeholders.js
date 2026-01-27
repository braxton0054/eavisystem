const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function searchPlaceholders() {
    const templatePath = path.join(__dirname, 'backend', 'templates', 'admission_template.pdf');
    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // This is a hacky way to see what's in the content stream
    // contentStream is an array of PDFContentStream objects
    const contentStream = firstPage.node.Contents();
    if (contentStream) {
        // Concatenate all streams if multiple
        const streams = Array.isArray(contentStream) ? contentStream : [contentStream];
        for (const stream of streams) {
            const bytes = stream.getContents();
            const text = Buffer.from(bytes).toString('utf-8');
            // Log a bit of the text and search for placeholders
            console.log('Stream chunk preview:', text.substring(0, 500));
            const matches = text.match(/\{\{[A-Z_]+\}\}/g);
            if (matches) {
                console.log('Found placeholders in stream:', matches);
            }
        }
    }
}

searchPlaceholders().catch(console.error);

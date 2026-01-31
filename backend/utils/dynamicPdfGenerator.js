const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const fs_sync = require('fs');
const path = require('path');

class DynamicAdmissionPDFGenerator {
    constructor() {
        this.outputPath = path.join(__dirname, '..', 'generated_pdfs');
        this.assetsPath = path.join(__dirname, '..', '..', 'public', 'assets');
        this.margins = { top: 40, bottom: 60, left: 60, right: 60 };
        this.lineHeight = 16;
    }

    async #loadImages(pdfDoc) {
        try {
            const headerPath = path.join(this.assetsPath, 'header.png');
            const stampPath = path.join(this.assetsPath, 'stamp.png');

            let headerImage = null;
            let stampImage = null;

            try {
                const headerBytes = await fs.readFile(headerPath);
                headerImage = await pdfDoc.embedPng(headerBytes);
            } catch (e) { console.warn('Header image not found at', headerPath); }

            try {
                const stampBytes = await fs.readFile(stampPath);
                stampImage = await pdfDoc.embedPng(stampBytes);
            } catch (e) { console.warn('Stamp image not found at', stampPath); }

            return { headerImage, stampImage };
        } catch (error) {
            console.error('Error loading images for PDF:', error);
            return { headerImage: null, stampImage: null };
        }
    }

    async #drawStamp(page, stampImage, yPos = 100) {
        if (!stampImage) return;
        const { width, height } = page.getSize();
        const stampDims = stampImage.scale(0.8);
        page.drawImage(stampImage, {
            x: width - stampDims.width - 40,
            y: yPos,
            width: stampDims.width,
            height: stampDims.height,
        });
    }

    async #drawHeader(page, headerImage) {
        if (!headerImage) return 0;
        const { width, height } = page.getSize();
        const imgWidth = width - 40;
        const imgHeight = (headerImage.height / headerImage.width) * imgWidth;
        page.drawImage(headerImage, {
            x: 20,
            y: height - imgHeight - 10,
            width: imgWidth,
            height: imgHeight,
        });
        return imgHeight + 30;
    }

    /**
     * Generate the full admission package
     */
    async generateFullAdmissionPackage(studentData, courseData, institutionData = {}) {
        try {
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

            const { headerImage, stampImage } = await this.#loadImages(pdfDoc);

            const institution = {
                equity_acc: '0470292838961',
                kcb_acc: '1115207350',
                paybill: '257557',
                ...institutionData
            };

            // Page 1: Admission Letter
            await this.#drawAdmissionLetter(pdfDoc, font, boldFont, italicFont, headerImage, stampImage, studentData, courseData, institution);

            // Page 2: Bursary Support Letter
            await this.#drawBursaryLetter(pdfDoc, font, boldFont, italicFont, headerImage, stampImage, studentData, courseData, institution);

            // Page 3: Requirements
            await this.#drawRequirementsPage(pdfDoc, font, boldFont, italicFont, headerImage, stampImage, studentData, courseData);

            // Page 4: Append Fee Structure if exists
            if (courseData.fee_structure_pdf_name) {
                try {
                    const feeFilename = courseData.fee_structure_pdf_name;
                    const rootDir = path.join(__dirname, '..', '..');
                    const publicFeePath = path.join(rootDir, 'public', 'fee', feeFilename);
                    const tmpFeePath = path.join('/tmp', 'fee', feeFilename);

                    let feePath = fs_sync.existsSync(publicFeePath) ? publicFeePath :
                        fs_sync.existsSync(tmpFeePath) ? tmpFeePath : null;

                    if (feePath) {
                        const feeBytes = await fs.readFile(feePath);
                        const feePdf = await PDFDocument.load(feeBytes);
                        const copiedPages = await pdfDoc.copyPages(feePdf, feePdf.getPageIndices());
                        copiedPages.forEach((page) => pdfDoc.addPage(page));
                        console.log(`Appended fee structure: ${feeFilename}`);
                    }
                } catch (e) {
                    console.error('Error appending fee structure to PDF:', e);
                }
            }

            const pdfBytes = await pdfDoc.save();
            return pdfBytes;
        } catch (error) {
            console.error('Error generating admission package:', error);
            throw error;
        }
    }

    async #drawAdmissionLetter(pdfDoc, font, boldFont, italicFont, headerImage, stampImage, studentData, courseData, institution) {
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();

        const headerHeight = await this.#drawHeader(page, headerImage);
        let currentY = height - headerHeight;
        const leftX = this.margins.left;

        const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' });

        // Ref and Date
        page.drawText('Our Ref:', { x: leftX, y: currentY, size: 11, font: boldFont });
        const refNo = studentData.admission_number || `EAVI/REF/${new Date().getFullYear()}`;
        page.drawText(` ${refNo}`, { x: leftX + 50, y: currentY, size: 11, font: font });
        page.drawText(`Date: ${today}`, { x: width - 150, y: currentY, size: 11, font: font });
        currentY -= 40;

        page.drawText('Dear Sir/Madam,', { x: leftX, y: currentY, size: 12, font: boldFont });
        currentY -= 30;

        const title = 'RE: ADMISSION LETTER';
        page.drawText(title, { x: leftX, y: currentY, size: 14, font: boldFont });
        // Underline title
        page.drawLine({
            start: { x: leftX, y: currentY - 2 },
            end: { x: leftX + boldFont.widthOfTextAtSize(title, 14), y: currentY - 2 },
            thickness: 1,
            color: rgb(0, 0, 0)
        });
        currentY -= 40;

        page.drawText('Name:', { x: leftX, y: currentY, size: 12, font: boldFont });
        const studentNameUpper = (studentData.student_name || '').toUpperCase();
        const displayStudentName = studentNameUpper || '................................................................';
        page.drawText(` ${displayStudentName}`, { x: leftX + 45, y: currentY, size: 12, font: boldFont });
        // Underline Student Name
        if (studentNameUpper) {
            page.drawLine({
                start: { x: leftX + 48, y: currentY - 2 },
                end: { x: leftX + 48 + boldFont.widthOfTextAtSize(displayStudentName, 12), y: currentY - 2 },
                thickness: 1,
                color: rgb(0, 0, 0)
            });
        }
        currentY -= 35;

        const fullCongratsText = "Congratulations! We are pleased to inform you that, with the approval of the Board of Directors, you have been admitted as a student of East Africa Vision Institute (EAVI).";

        page.drawText(fullCongratsText, {
            x: leftX,
            y: currentY,
            size: 11,
            font: font,
            maxWidth: width - (leftX * 2),
            lineHeight: 15
        });
        currentY -= 45;

        const courseName = courseData.course_name || '................................................';
        const courseType = courseName.toLowerCase().includes('diploma') ? 'Diploma' :
            courseName.toLowerCase().includes('certificate') ? 'Certificate' :
                courseName.toLowerCase().includes('artisan') ? 'Artisan' : 'Diploma / Certificate / Artisan';

        // Breaking the line to underline specific parts
        const line1 = `You have been admitted for the ${courseType} in `;
        page.drawText(line1, { x: leftX, y: currentY, size: 11, font: font });
        let xOffset = leftX + font.widthOfTextAtSize(line1, 11);

        page.drawText(courseName, { x: xOffset, y: currentY, size: 11, font: boldFont });
        // Underline Course Name
        page.drawLine({
            start: { x: xOffset, y: currentY - 2 },
            end: { x: xOffset + boldFont.widthOfTextAtSize(courseName, 11), y: currentY - 2 },
            thickness: 1
        });

        currentY -= 20;
        const line2 = `with Admission Number: `;
        page.drawText(line2, { x: leftX, y: currentY, size: 11, font: font });
        xOffset = leftX + font.widthOfTextAtSize(line2, 11);

        const admNo = studentData.admission_number || '..........................';
        page.drawText(admNo, { x: xOffset, y: currentY, size: 11, font: boldFont });
        // Underline Admission Number
        page.drawLine({
            start: { x: xOffset, y: currentY - 2 },
            end: { x: xOffset + boldFont.widthOfTextAtSize(admNo, 11), y: currentY - 2 },
            thickness: 1
        });

        currentY -= 35;

        page.drawText(`You are required to report to the Institute on:`, { x: leftX, y: currentY, size: 11, font: font });
        currentY -= 20;
        page.drawText(`${studentData.reporting_date || '....................................................................'}`, { x: leftX, y: currentY, size: 11, font: boldFont });
        currentY -= 35;

        page.drawText('Note:', { x: leftX, y: currentY, size: 11, font: boldFont });
        page.drawText(' You are required to report to the college immediately.', { x: leftX + 35, y: currentY, size: 11, font: italicFont });
        currentY -= 50;

        const feeTitle = 'Fee Payment Details';
        page.drawText(feeTitle, { x: leftX, y: currentY, size: 13, font: boldFont });
        currentY -= 25;

        page.drawText('East Africa Vision Institute', { x: leftX, y: currentY, size: 11, font: boldFont });
        currentY -= 20;
        page.drawText('Equity Bank:', { x: leftX, y: currentY, size: 11, font: boldFont });
        page.drawText(` Account No. ${institution.equity_acc}`, { x: leftX + 80, y: currentY, size: 11, font: font });
        currentY -= 15;
        page.drawText('KCB Bank:', { x: leftX, y: currentY, size: 11, font: boldFont });
        page.drawText(` Account No. ${institution.kcb_acc}`, { x: leftX + 70, y: currentY, size: 11, font: font });
        currentY -= 15;
        page.drawText('M-PESA Paybill:', { x: leftX, y: currentY, size: 11, font: boldFont });
        page.drawText(` ${institution.paybill}, Account Number: ${studentData.student_name || ''}`, { x: leftX + 100, y: currentY, size: 11, font: font });
        currentY -= 30;

        page.drawText('Note:', { x: leftX, y: currentY, size: 11, font: boldFont });
        page.drawText(' We do not accept cash payments. All fees must be deposited in the above accounts only.', { x: leftX + 35, y: currentY, size: 11, font: font, maxWidth: width - leftX - 40 });
        currentY -= 50;

        page.drawText('Yours faithfully,', { x: leftX, y: currentY, size: 11, font: font });
        currentY -= 30;

        page.drawText('TRIZAH JUMA', { x: leftX, y: currentY, size: 12, font: boldFont });
        currentY -= 18;
        page.drawText('For Directors:', { x: leftX, y: currentY, size: 11, font: font });
        currentY -= 25;

        const footerSize = 9;
        page.drawText('Philemon Saina (B.Sc. Eng, MBA)', { x: leftX, y: currentY, size: footerSize, font: font });
        currentY -= 12;
        page.drawText('Beth Mwangi (B.A, MBA, PhD Finance)', { x: leftX, y: currentY, size: footerSize, font: font });
        currentY -= 12;
        page.drawText('R. B. Patel (B.Sc. Eng, M.Sc.)', { x: leftX, y: currentY, size: footerSize, font: font });

        await this.#drawStamp(page, stampImage);
    }

    async #drawBursaryLetter(pdfDoc, font, boldFont, italicFont, headerImage, stampImage, studentData, courseData, institution) {
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();

        const headerHeight = await this.#drawHeader(page, headerImage);
        let currentY = height - headerHeight;
        const leftX = this.margins.left;

        const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' });
        page.drawText('Our Ref:', { x: leftX, y: currentY, size: 11, font: boldFont });
        const bursaryRef = studentData.admission_number || `EAVI/REF/${new Date().getFullYear()}`;
        page.drawText(` ${bursaryRef}`, { x: leftX + 50, y: currentY, size: 11, font: font });
        page.drawText(`Date: ${today}`, { x: width - 150, y: currentY, size: 11, font: font });
        currentY -= 20;
        page.drawText('Your Ref:', { x: leftX, y: currentY, size: 11, font: boldFont });
        currentY -= 40;

        page.drawText('THE CHAIRPERSON', { x: leftX, y: currentY, size: 12, font: boldFont });
        currentY -= 18;
        page.drawText('BURSARY COMMITTEE', { x: leftX, y: currentY, size: 12, font: boldFont });
        currentY -= 40;

        const bursaryTitle = 'RE: BURSARY SUPPORT FOR,';
        page.drawText(bursaryTitle, { x: leftX, y: currentY, size: 13, font: boldFont });
        page.drawLine({
            start: { x: leftX, y: currentY - 2 },
            end: { x: leftX + boldFont.widthOfTextAtSize(bursaryTitle, 13), y: currentY - 2 },
            thickness: 1,
            color: rgb(0, 0, 0)
        });
        currentY -= 35;

        page.drawText('Name:', { x: leftX, y: currentY, size: 12, font: boldFont });
        const studentNameUpper = (studentData.student_name || '').toUpperCase();
        const displayStudentName = studentNameUpper || '................................................................';
        page.drawText(` ${displayStudentName}`, { x: leftX + 45, y: currentY, size: 12, font: boldFont });
        // Underline Student Name
        if (studentNameUpper) {
            page.drawLine({
                start: { x: leftX + 48, y: currentY - 2 },
                end: { x: leftX + 48 + boldFont.widthOfTextAtSize(displayStudentName, 12), y: currentY - 2 },
                thickness: 1
            });
        }
        currentY -= 30;

        const studentLine = "The above-named student ";
        page.drawText(studentLine, { x: leftX, y: currentY, size: 11, font: font });
        let xOffset = leftX + font.widthOfTextAtSize(studentLine, 11);

        const admNoText = `Adm. No. ${studentData.admission_number || '.....................................'}`;
        page.drawText(admNoText, { x: xOffset, y: currentY, size: 11, font: boldFont });
        // Underline Admission Number
        page.drawLine({
            start: { x: xOffset, y: currentY - 2 },
            end: { x: xOffset + boldFont.widthOfTextAtSize(admNoText, 11), y: currentY - 2 },
            thickness: 1
        });
        currentY -= 30;

        const courseName = courseData.course_name || '................................................';
        const courseType = courseName.toLowerCase().includes('diploma') ? 'Diploma' :
            courseName.toLowerCase().includes('certificate') ? 'Certificate' :
                courseName.toLowerCase().includes('artisan') ? 'Artisan' : 'Diploma / Certificate / Artisan';

        const enrollLine = `Enrolled for ${courseType} course in `;
        page.drawText(enrollLine, { x: leftX, y: currentY, size: 11, font: font });
        xOffset = leftX + font.widthOfTextAtSize(enrollLine, 11);

        page.drawText(courseName, { x: xOffset, y: currentY, size: 11, font: boldFont });
        // Underline Course Name
        page.drawLine({
            start: { x: xOffset, y: currentY - 2 },
            end: { x: xOffset + boldFont.widthOfTextAtSize(courseName, 11), y: currentY - 2 },
            thickness: 1
        });
        currentY -= 40;

        const feeBalance = courseData.fee_per_term || '..........';
        const totalFeesYear = courseData.fee_per_year || '............';

        const bodyLines = [
            `Due to financial difficulties, the student is not able to continue / start the course`,
            `immediately; therefore we request that you give the student school fees support.`,
            `The student has a fee balance of KES ${feeBalance}. The total fees per year is`,
            `KES ${totalFeesYear}.`
        ];

        bodyLines.forEach(line => {
            page.drawText(line, { x: leftX, y: currentY, size: 11, font: font, maxWidth: width - (leftX * 2) });
            currentY -= 18;
        });
        currentY -= 30;

        const paymentTitle = 'Fee Payment Details';
        page.drawText(paymentTitle, { x: leftX, y: currentY, size: 12, font: boldFont });
        currentY -= 25;

        page.drawText('East Africa Vision Institute', { x: leftX, y: currentY, size: 11, font: boldFont });
        currentY -= 20;
        page.drawText(`Equity Bank ACC NO: ${institution.equity_acc} or`, { x: leftX, y: currentY, size: 11, font: font });
        currentY -= 15;
        page.drawText(`KCB A/C NO: ${institution.kcb_acc} or`, { x: leftX, y: currentY, size: 11, font: font });
        currentY -= 15;
        page.drawText(`MPESA: PAYBILL NO ${institution.paybill}, ACCOUNT NO ${studentData.student_name || ''}`, { x: leftX, y: currentY, size: 11, font: font });
        currentY -= 45;

        page.drawText('I believe you will consider her/his request.', { x: leftX, y: currentY, size: 11, font: font });
        currentY -= 20;
        page.drawText('Thank you in advance, yours faithfully,', { x: leftX, y: currentY, size: 11, font: font });
        currentY -= 40;

        page.drawText('TRIZAH JUMA', { x: leftX, y: currentY, size: 12, font: boldFont });
        currentY -= 18;
        page.drawText('For College Principal', { x: leftX, y: currentY, size: 11, font: boldFont });

        await this.#drawStamp(page, stampImage);
    }

    async #drawRequirementsPage(pdfDoc, font, boldFont, italicFont, headerImage, stampImage, studentData, courseData) {
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();

        const headerHeight = await this.#drawHeader(page, headerImage);
        let currentY = height - headerHeight;
        const leftX = this.margins.left;

        const reqTitle = 'REQUIREMENTS';
        page.drawText(reqTitle, { x: (width - boldFont.widthOfTextAtSize(reqTitle, 18)) / 2, y: currentY, size: 18, font: boldFont });
        currentY -= 45;

        page.drawText('Documents (All Students):', { x: leftX, y: currentY, size: 13, font: boldFont });
        currentY -= 25;
        const docs = [
            'Admission Letter: copy',
            'KCSE Certificate or Results Slip: copy',
            'National ID or Birth Certificate: copy',
            'Passport-Sized Photographs: 2-4 recent photos',
            'Bank Payment Slip: Proof of tuition fee payment',
            'Accommodation Payment Receipt: If applicable'
        ];
        docs.forEach(doc => {
            page.drawText(`• ${doc}`, { x: leftX + 15, y: currentY, size: 11, font: font });
            currentY -= 18;
        });
        currentY -= 30;

        const isMedical = (courseData.department_name || '').toLowerCase().includes('medical') ||
            (courseData.department_name || '').toLowerCase().includes('health') ||
            (courseData.department_name || '').toLowerCase().includes('nursing') ||
            (courseData.department_name || '').toLowerCase().includes('perioperative') ||
            (courseData.course_name || '').toLowerCase().includes('medical') ||
            (courseData.course_name || '').toLowerCase().includes('health') ||
            (courseData.course_name || '').toLowerCase().includes('nursing') ||
            (courseData.course_name || '').toLowerCase().includes('lab') ||
            (courseData.course_name || '').toLowerCase().includes('psychology');

        if (isMedical) {
            page.drawText('Uniforms & Clothing (Medical Students Only):', { x: leftX, y: currentY, size: 13, font: boldFont });
            currentY -= 25;

            const uniforms = [
                'KMTC Uniform with EAVI Logo',
                'Ladies: Dress - 2 pairs',
                'Boys: Trousers + White Shirt - 2 pairs',
                'White Lab Coat with EAVI Logo: 2 coats',
                'Scrubs: 2 pairs'
            ];
            uniforms.forEach(u => {
                page.drawText(`• ${u}`, { x: leftX + 15, y: currentY, size: 11, font: font });
                currentY -= 18;
            });
            currentY -= 30;

            page.drawText('Footwear (Medical Students Only):', { x: leftX, y: currentY, size: 13, font: boldFont });
            currentY -= 25;
            page.drawText(`• Crocs: 2 pairs`, { x: leftX + 15, y: currentY, size: 11, font: font });
            currentY -= 18;
            page.drawText(`• Shoes: 2 pairs`, { x: leftX + 15, y: currentY, size: 11, font: font });
            currentY -= 35;
        }

        page.drawText('Academic & Stationery (All Students):', { x: leftX, y: currentY, size: 13, font: boldFont });
        currentY -= 25;
        const items = [
            'Notebooks: For lectures and practical\'s',
            'Writing Instruments: Pens, pencils, erasers, highlighters',
            'Calculator: Required for certain courses',
            'Laptop or Tablet: For e-learning, research, and assignments'
        ];
        items.forEach(item => {
            page.drawText(`• ${item}`, { x: leftX + 15, y: currentY, size: 11, font: font });
            currentY -= 18;
        });
        currentY -= 50;

        const closingNote = 'Ensure all items are prepared and organized prior to the reporting day to facilitate a smooth registration process.';
        page.drawText(closingNote, { x: leftX, y: currentY, size: 11, font: boldFont, maxWidth: width - (leftX * 2), lineHeight: 15 });

        await this.#drawStamp(page, stampImage, 60);
    }

    async savePDF(pdfBytes, filename) {
        try {
            await fs.mkdir(this.outputPath, { recursive: true });
            const filePath = path.join(this.outputPath, filename);
            await fs.writeFile(filePath, pdfBytes);
            return filePath;
        } catch (error) {
            console.error('Error saving PDF:', error);
            throw error;
        }
    }

    // Legacy support
    async generateAdmissionLetter(studentData, courseData, institutionData = {}) {
        return this.generateFullAdmissionPackage(studentData, courseData, institutionData);
    }
}

module.exports = DynamicAdmissionPDFGenerator;

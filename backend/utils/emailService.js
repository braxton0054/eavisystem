const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class EmailService {
    constructor() {
        // These should be set in .env
        this.user = process.env.EMAIL_USER;
        this.pass = process.env.EMAIL_PASS;

        if (!this.user || !this.pass) {
            console.warn('⚠️  EMAIL CONFIGURATION WARNING:');
            console.warn('   EMAIL_USER or EMAIL_PASS not set in .env file');
            console.warn('   Emails will not be sent until credentials are configured');
            console.warn('   See EMAIL_SETUP_GUIDE.md for setup instructions');
        } else {
            console.log('✅ Email service initialized with:', this.user);
        }

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.user,
                pass: this.pass
            }
        });
    }

    async sendSubmissionEmail(studentData, admissionPdfPath, feePdfName) {
        if (!studentData.email) {
            console.warn('⚠️  Cannot send email: No student email provided');
            return { success: false, error: 'No student email provided' };
        }

        if (!this.user || !this.pass) {
            console.warn('⚠️  Cannot send email: Email credentials not configured in .env');
            console.warn('   Please see EMAIL_SETUP_GUIDE.md for setup instructions');
            return { success: false, error: 'Email configuration missing - check .env file' };
        }

        const feePdfPath = feePdfName ? path.join(__dirname, '..', 'fee', feePdfName) : null;

        const attachments = [];
        if (admissionPdfPath && fs.existsSync(admissionPdfPath)) {
            attachments.push({
                filename: `Admission_Letter_${studentData.admission_number}.pdf`,
                path: admissionPdfPath
            });
            console.log('✅ Admission PDF attached:', admissionPdfPath);
        } else {
            console.warn('⚠️  Admission PDF not found:', admissionPdfPath);
        }

        if (feePdfPath && fs.existsSync(feePdfPath)) {
            attachments.push({
                filename: `Fee_Structure_${feePdfName.split('_').slice(1).join('_') || 'Course'}.pdf`,
                path: feePdfPath
            });
            console.log('✅ Fee Structure PDF attached:', feePdfPath);
        } else if (feePdfName) {
            console.warn('⚠️  Fee Structure PDF not found:', feePdfPath);
        }

        const mailOptions = {
            from: `"East Africa Vision Institute" <${this.user}>`,
            to: studentData.email,
            subject: '🎓 Welcome to East Africa Vision Institute - Admission Confirmed!',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 20px 0;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                    
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                                                🎓 East Africa Vision Institute
                                            </h1>
                                            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 14px; letter-spacing: 1px;">
                                                LEADING THE LEADERS
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Main Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">
                                                Congratulations, ${studentData.full_name}! 🎉
                                            </h2>
                                            
                                            <p style="color: #555; line-height: 1.8; margin: 0 0 20px 0; font-size: 16px;">
                                                We are delighted to inform you that your application for admission has been <strong style="color: #27ae60;">successfully approved</strong>!
                                            </p>
                                            
                                            <!-- Info Box -->
                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 8px; margin: 25px 0;">
                                                <tr>
                                                    <td style="padding: 20px;">
                                                        <p style="margin: 0 0 12px 0; color: #2c3e50; font-size: 15px;">
                                                            <strong>📋 Admission Number:</strong> 
                                                            <span style="color: #667eea; font-weight: 600; font-size: 16px;">${studentData.admission_number}</span>
                                                        </p>
                                                        <p style="margin: 0 0 12px 0; color: #2c3e50; font-size: 15px;">
                                                            <strong>📚 Course:</strong> ${studentData.course_name || 'Your chosen course'}
                                                        </p>
                                                        <p style="margin: 0; color: #2c3e50; font-size: 15px;">
                                                            <strong>🏫 Campus:</strong> ${studentData.campus_name === 'west' ? 'West Campus' : 'Twon Campus'}
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="color: #555; line-height: 1.8; margin: 25px 0; font-size: 16px;">
                                                We have attached the following documents to this email:
                                            </p>
                                            
                                            <!-- Documents List -->
                                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                                                <tr>
                                                    <td style="padding: 12px; background-color: #e8f5e9; border-radius: 6px; margin-bottom: 10px;">
                                                        <p style="margin: 0; color: #2c3e50; font-size: 15px;">
                                                            ✅ <strong>Admission Letter</strong> - Your official admission document
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr><td style="height: 10px;"></td></tr>
                                                <tr>
                                                    <td style="padding: 12px; background-color: #fff3e0; border-radius: 6px;">
                                                        <p style="margin: 0; color: #2c3e50; font-size: 15px;">
                                                            💰 <strong>Fee Structure</strong> - Complete breakdown of course fees
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="color: #555; line-height: 1.8; margin: 25px 0 0 0; font-size: 16px;">
                                                Please review these documents carefully and follow the instructions provided for your reporting date.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Next Steps -->
                                    <tr>
                                        <td style="padding: 0 30px 30px 30px;">
                                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 8px; padding: 20px;">
                                                <tr>
                                                    <td>
                                                        <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">
                                                            📌 Next Steps:
                                                        </h3>
                                                        <ol style="color: #555; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
                                                            <li style="margin-bottom: 8px;">Download and print your admission letter</li>
                                                            <li style="margin-bottom: 8px;">Review the fee structure and payment details</li>
                                                            <li style="margin-bottom: 8px;">Note your reporting date and time</li>
                                                            <li>Prepare the required documents for registration</li>
                                                        </ol>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #2c3e50; padding: 30px; text-align: center;">
                                            <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                                                Welcome to the East Africa Vision Institute Family!
                                            </p>
                                            <p style="color: #bdc3c7; margin: 0; font-size: 14px; line-height: 1.6;">
                                                Admissions Office<br>
                                                East Africa Vision Institute<br>
                                                📧 ${this.user} | 📱 Contact us for any queries
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Disclaimer -->
                                    <tr>
                                        <td style="padding: 20px 30px; background-color: #f8f9fa;">
                                            <p style="color: #95a5a6; margin: 0; font-size: 12px; text-align: center; line-height: 1.5;">
                                                This is an automated message. Please do not reply directly to this email.<br>
                                                If you have any questions, please contact our admissions office.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
            attachments: attachments
        };

        try {
            console.log(`📧 Sending admission email to: ${studentData.email}`);
            console.log(`   Student: ${studentData.full_name}`);
            console.log(`   Admission #: ${studentData.admission_number}`);
            console.log(`   Attachments: ${attachments.length}`);

            const info = await this.transporter.sendMail(mailOptions);

            console.log('✅ Email sent successfully!');
            console.log('   Message ID:', info.messageId);
            console.log('   To:', studentData.email);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Error sending email:');
            console.error('   Error:', error.message);
            console.error('   Code:', error.code);

            if (error.code === 'EAUTH') {
                console.error('   ⚠️  AUTHENTICATION FAILED!');
                console.error('   Please check your Gmail App Password in .env file');
                console.error('   See EMAIL_SETUP_GUIDE.md for instructions');
            }

            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();

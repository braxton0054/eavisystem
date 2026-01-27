const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const PDFTemplateFiller = require('./backend/utils/pdfTemplateFiller');
const emailService = require('./backend/utils/emailService');
const bcrypt = require('bcryptjs');
const multer = require('multer');
require('dotenv').config();

// Configure multer for fee structure PDFs
const feeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use /tmp for uploads on Vercel (read-only filesystem elsewhere)
    const dir = process.env.VERCEL
      ? path.join('/tmp', 'fee')
      : path.join(__dirname, 'backend', 'fee');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Keep original name but clean it for filesystem
    const safeName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    cb(null, Date.now() + '_' + safeName);
  }
});
const uploadFee = multer({
  storage: feeStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connections
const twonPool = new Pool({
  connectionString: process.env.TWON_DB_URL
});

const westPool = new Pool({
  connectionString: process.env.WEST_DB_URL
});

// Get database pool by campus
function getPool(campus) {
  return campus === 'west' ? westPool : twonPool;
}

// Reusable function to generate student admission PDF
async function generateStudentPDF(client, campus, admissionNumber) {
  try {
    // 1. Get student info with course data
    const studentQuery = `
      SELECT s.*, c.course_name, c.department, c.duration_years, c.fee_per_term, c.fee_per_year
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE s.admission_number = $1 AND s.campus_name = $2
    `;
    const result = await client.query(studentQuery, [admissionNumber, campus]);

    if (result.rows.length === 0) return null;

    const student = result.rows[0];
    const filename = student.pdf_path || `${student.full_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;

    // Choose base path based on environment
    const baseDir = process.env.VERCEL
      ? path.join('/tmp', 'admission')
      : path.join(__dirname, 'backend', 'admission');

    const filePath = path.join(baseDir, filename);

    // If file already exists, return its path
    if (fs.existsSync(filePath)) return filePath;

    console.log(`Generating PDF for ${admissionNumber}...`);

    // 2. Get campus settings for reporting dates
    const settingsResult = await client.query('SELECT * FROM campus_settings WHERE campus_name = $1', [campus]);
    const settings = settingsResult.rows[0] || {};

    // 3. Determine reporting date
    let reportingDateStr = student.reporting_date ? new Date(student.reporting_date).toLocaleDateString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

    const term = parseInt(student.term);
    if (term === 1 && settings.reporting_date_term1) reportingDateStr = new Date(settings.reporting_date_term1).toLocaleDateString();
    else if (term === 2 && settings.reporting_date_term2) reportingDateStr = new Date(settings.reporting_date_term2).toLocaleDateString();
    else if (term === 3 && settings.reporting_date_term3) reportingDateStr = new Date(settings.reporting_date_term3).toLocaleDateString();

    // 4. Fill template
    const templateData = {
      student_name: student.full_name,
      admission_number: student.admission_number,
      course_name: student.course_name,
      department: student.department,
      campus: student.campus_name,
      email: student.email,
      phone: student.phone_number,
      date_of_birth: student.date_of_birth,
      location: student.location,
      kcse_grade: student.kcse_grade || 'Not Provided',
      admission_date: student.admission_date,
      reporting_date: reportingDateStr,
      duration: `${student.duration_years} year${student.duration_years > 1 ? 's' : ''}`,
      fee_per_term: `KSh ${student.fee_per_term}`,
      total_fee: `KSh ${student.fee_per_year * student.duration_years}`,
      issue_date: new Date().toLocaleDateString()
    };

    const generatedPath = await pdfFiller.fillAndSaveTemplate(templateData);
    const generatedFilename = path.basename(generatedPath);

    // 5. Update DB
    await client.query(
      'UPDATE students SET pdf_path = $1 WHERE admission_number = $2 AND campus_name = $3',
      [generatedFilename, admissionNumber, campus]
    );

    return generatedPath;
  } catch (err) {
    console.error('Error generating student PDF:', err);
    return null;
  }
}

// Initialize PDF template filler
const pdfFiller = new PDFTemplateFiller();

// Explicit routes first (before static files)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/student/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// Admin login route
app.get('/admin/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});


// Admin dashboard route (authenticated)
app.get('/admin/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// PDF test page
app.get('/admin/pdf-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/pdf-test.html'));
});

// Serve static files (after explicit routes)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: 3000 });
});

// Generate admission letter PDF by filling template
app.post('/api/:campus/generate-admission-pdf/:studentId', async (req, res) => {
  try {
    const { campus, studentId } = req.params;

    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      // Get student information with course details
      const studentQuery = `
        SELECT s.*, c.course_name, c.department, c.duration_years, c.fee_per_term, c.fee_per_year, c.minimum_kcse_grade
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.course_id
        WHERE s.admission_number = $1 AND s.campus_name = $2
      `;

      const studentResult = await client.query(studentQuery, [studentId, campus]);

      if (studentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }

      const student = studentResult.rows[0];

      // 1. Get campus settings for reporting dates
      const settingsResult = await client.query('SELECT * FROM campus_settings WHERE campus_name = $1', [campus]);
      const settings = settingsResult.rows[0] || {};

      // 2. Determine reporting date based on student term
      let reportingDateStr = student.reporting_date ? new Date(student.reporting_date).toLocaleDateString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

      const term = parseInt(student.term);
      if (term === 1 && settings.reporting_date_term1) reportingDateStr = new Date(settings.reporting_date_term1).toLocaleDateString();
      else if (term === 2 && settings.reporting_date_term2) reportingDateStr = new Date(settings.reporting_date_term2).toLocaleDateString();
      else if (term === 3 && settings.reporting_date_term3) reportingDateStr = new Date(settings.reporting_date_term3).toLocaleDateString();

      // Prepare data for template filling
      const templateData = {
        student_name: student.full_name,
        admission_number: student.admission_number,
        course_name: student.course_name,
        department: student.department,
        campus: student.campus_name,
        email: student.email,
        phone: student.phone_number,
        date_of_birth: student.date_of_birth,
        location: student.location,
        kcse_grade: student.kcse_grade || 'Not Provided',
        admission_date: student.admission_date,
        reporting_date: reportingDateStr,
        duration: `${student.duration_years} year${student.duration_years > 1 ? 's' : ''}`,
        fee_per_term: `$${student.fee_per_term}`,
        total_fee: `$${student.fee_per_year * student.duration_years}`,
        issue_date: new Date().toLocaleDateString()
      };

      // Fill template and save
      const pdfPath = await pdfFiller.fillAndSaveTemplate(templateData);
      const filename = path.basename(pdfPath);

      // Save filename to database
      await client.query(
        'UPDATE students SET pdf_path = $1 WHERE admission_number = $2 AND campus_name = $3',
        [filename, studentId, campus]
      );

      res.json({
        success: true,
        message: 'Admission letter generated successfully',
        pdfPath: pdfPath,
        fileName: filename,
        downloadUrl: `/api/${campus}/students/download/${studentId}`
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error generating admission PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate admission letter'
    });
  }
});

// Serve generated PDFs
app.get('/generated-pdfs/:filename', (req, res) => {
  const filename = req.params.filename;

  // Try both local and /tmp paths
  const localPath = path.join(__dirname, 'backend', 'admission', filename);
  const tmpPath = path.join('/tmp', 'admission', filename);

  if (fs.existsSync(localPath)) {
    res.sendFile(localPath);
  } else if (fs.existsSync(tmpPath)) {
    res.sendFile(tmpPath);
  } else {
    res.status(404).json({
      success: false,
      error: 'PDF not found'
    });
  }
});

// Settings endpoints
app.get('/api/:campus/settings', async (req, res) => {
  try {
    const { campus } = req.params;
    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      const result = await client.query('SELECT * FROM campus_settings WHERE campus_name = $1', [campus]);

      if (result.rows.length === 0) {
        // Create default settings if not exists
        const insertResult = await client.query(
          'INSERT INTO campus_settings (campus_name, admission_number_format, admission_starting_number, current_sequence_number) VALUES ($1, $2, $3, $4) RETURNING *',
          [campus, `${campus.toUpperCase()}-{year}-{seq}`, campus === 'west' ? 2001 : 1001, campus === 'west' ? 2001 : 1001]
        );
        return res.json({ success: true, data: insertResult.rows[0] });
      }

      res.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/:campus/settings', async (req, res) => {
  try {
    const { campus } = req.params;
    const {
      admission_number_format,
      admission_starting_number,
      reporting_date_term1,
      reporting_date_term2,
      reporting_date_term3
    } = req.body;

    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      // 1. Validate Admission Starting Number
      const currentSettings = await client.query('SELECT current_sequence_number FROM campus_settings WHERE campus_name = $1', [campus]);
      if (currentSettings.rows.length > 0) {
        const currentMax = currentSettings.rows[0].current_sequence_number;
        if (admission_starting_number < currentMax) {
          return res.status(400).json({
            success: false,
            error: `Starting number cannot be less than the current sequence (${currentMax})`
          });
        }
      }

      // 2. Validate Reporting Dates
      const validateDate = (dateStr, label) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date <= today) {
          return `${label} must be a future date (not today or past).`;
        }

        const day = date.getDay(); // 0 = Sun, 6 = Sat
        if (day === 0 || day === 6) {
          return `${label} must be a weekday (Monday to Friday).`;
        }
        return null;
      };

      const dateErrors = [
        validateDate(reporting_date_term1, 'Term 1 Reporting Date'),
        validateDate(reporting_date_term2, 'Term 2 Reporting Date'),
        validateDate(reporting_date_term3, 'Term 3 Reporting Date')
      ].filter(err => err !== null);

      if (dateErrors.length > 0) {
        return res.status(400).json({ success: false, error: dateErrors[0] });
      }

      const result = await client.query(
        `INSERT INTO campus_settings (
          campus_name, admission_number_format, admission_starting_number, 
          current_sequence_number, reporting_date_term1, reporting_date_term2, reporting_date_term3
        ) 
         VALUES ($1, $2, $3, $3, $4, $5, $6) 
         ON CONFLICT (campus_name) DO UPDATE 
         SET admission_number_format = $2, 
             admission_starting_number = $3,
             reporting_date_term1 = $4,
             reporting_date_term2 = $5,
             reporting_date_term3 = $6,
             updated_at = NOW() 
         RETURNING *`,
        [campus, admission_number_format, admission_starting_number, reporting_date_term1, reporting_date_term2, reporting_date_term3]
      );

      res.json({ success: true, message: 'Settings updated successfully', data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin login routes
app.post('/api/:campus/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const campus = req.params.campus;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      // Get admin user
      const result = await client.query(
        'SELECT * FROM admins WHERE username = $1 AND campus_name = $2 AND is_active = true',
        [username, campus]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const admin = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Generate mock token (in production, use JWT)
      const token = `mock_token_${admin.admin_id}_${Date.now()}`;

      // Update last login
      await client.query(
        'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE admin_id = $1',
        [admin.admin_id]
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token: token,
          user: {
            admin_id: admin.admin_id,
            username: admin.username,
            email: admin.email,
            campus: admin.campus_name,
            role: admin.role
          },
          admin: {
            admin_id: admin.admin_id,
            username: admin.username,
            email: admin.email,
            campus: admin.campus_name,
            role: admin.role
          }
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Student API routes
app.get('/api/:campus/students', async (req, res) => {
  try {
    const campus = req.params.campus;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      // Get students with pagination
      const studentsQuery = `
        SELECT s.*, c.course_name, c.department as department_name, c.fee_structure_pdf_name
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.course_id
        WHERE s.campus_name = $1
        ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const studentsResult = await client.query(studentsQuery, [campus, limit, offset]);

      // Get total count
      const countQuery = 'SELECT COUNT(*) FROM students WHERE campus_name = $1';
      const countResult = await client.query(countQuery, [campus]);

      res.json({
        success: true,
        data: {
          students: studentsResult.rows,
          pagination: {
            page: page,
            limit: limit,
            total: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / limit)
          }
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

app.get('/api/:campus/courses', async (req, res) => {
  try {
    const campus = req.params.campus;
    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM courses WHERE campus_name = $1 ORDER BY course_name',
        [campus]
      );

      res.json({
        success: true,
        data: result.rows
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
app.get('/api/:campus/courses/:courseId', async (req, res) => {
  try {
    const { campus, courseId } = req.params;
    const pool = getPool(campus);
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM courses WHERE course_id = $1 AND campus_name = $2', [courseId, campus]);
      if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Course not found' });
      res.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/:campus/departments', async (req, res) => {
  try {
    const { campus } = req.params;
    const pool = getPool(campus);
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT department_id as id, name FROM departments WHERE campus_name = $1 ORDER BY name', [campus]);
      res.json({ success: true, data: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/:campus/students/:admissionNumber', async (req, res) => {
  try {
    const { campus, admissionNumber } = req.params;
    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      const query = `
        SELECT s.*, c.course_name, c.department as department_name, c.fee_structure_pdf_name
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.course_id
        WHERE s.admission_number = $1 AND s.campus_name = $2
      `;
      const result = await client.query(query, [admissionNumber, campus]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }

      res.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get student detail error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Download student admission PDF
app.get('/api/:campus/students/download/:admissionNumber', async (req, res) => {
  try {
    const { campus, admissionNumber } = req.params;
    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      const pdfPath = await generateStudentPDF(client, campus, admissionNumber);
      if (pdfPath) {
        return res.sendFile(pdfPath);
      } else {
        return res.status(404).json({ success: false, error: 'Failed to generate admission letter' });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ success: false, error: 'Failed to download admission letter' });
  }
});

// Student registration
app.post('/api/:campus/registration/register', async (req, res) => {
  try {
    const campus = req.params.campus;
    const studentData = req.body;

    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      // Use database function for sequential admission number
      const admResult = await client.query('SELECT generate_admission_number($1) as admission_number', [campus]);
      const admissionNumber = admResult.rows[0].admission_number;

      // Insert student with 'admitted' status (auto-accept all students)
      const result = await client.query(`
        INSERT INTO students (
          admission_number, full_name, email, phone_number, date_of_birth, 
          location, course_id, term, campus_name, status, kcse_grade, admission_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *
      `, [
        admissionNumber,
        studentData.full_name,
        studentData.email,
        studentData.phone_number || studentData.phone, // Support both field names
        studentData.date_of_birth,
        studentData.location,
        studentData.course_id,
        studentData.term || 1,
        campus,
        studentData.status || 'admitted',
        studentData.kcse_grade || 'Not Provided',
        studentData.admission_date || new Date().toISOString().split('T')[0]
      ]);

      // Fetch complete student info with course data for the response
      const studentQuery = `
        SELECT s.*, c.course_name, c.department as department_name, c.fee_structure_pdf_name 
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.course_id
        WHERE s.student_id = $1
      `;
      const fullResult = await client.query(studentQuery, [result.rows[0].student_id]);
      const student = fullResult.rows[0];

      // Trigger asynchronous PDF generation and Email sending
      // We don't await this to keep registration response fast, 
      // but the user wants "immediately download", so we might actually WANT to await PDF generation
      const admissionPdfPath = await generateStudentPDF(client, campus, student.admission_number);

      if (student.email) {
        // Send email with both attachments
        emailService.sendSubmissionEmail(student, admissionPdfPath, student.fee_structure_pdf_name)
          .catch(err => console.error('Background email error:', err));
      }

      res.json({
        success: true,
        message: 'Student registration successful - Automatically admitted',
        data: {
          admission_number: student.admission_number,
          status: 'admitted',
          student_id: student.student_id,
          fee_structure_pdf_name: student.fee_structure_pdf_name
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Student lookup by phone number
app.get('/api/:campus/students/lookup/phone', async (req, res) => {
  try {
    const { campus } = req.params;
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      const query = `
        SELECT s.*, c.course_name, c.department as department_name, c.fee_structure_pdf_name
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.course_id
        WHERE (s.phone_number = $1 OR REPLACE(s.phone_number, ' ', '') = $1 OR s.phone_number LIKE $2)
        AND s.campus_name = $3
        ORDER BY s.created_at DESC
        LIMIT 1
      `;
      const result = await client.query(query, [phone, `%${phone}%`, campus]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'No admission record found for this phone number' });
      }

      const student = result.rows[0];
      res.json({
        success: true,
        data: {
          admission_number: student.admission_number,
          full_name: student.full_name,
          course_name: student.course_name,
          status: student.status,
          fee_structure_pdf_name: student.fee_structure_pdf_name
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Student lookup error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete course
app.delete('/api/:campus/courses/:courseId', async (req, res) => {
  try {
    const { campus, courseId } = req.params;
    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      // First, get the course_code before deleting
      const courseQuery = await client.query(
        'SELECT course_code FROM courses WHERE course_id = $1 AND campus_name = $2',
        [courseId, campus]
      );

      if (courseQuery.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }

      const courseCode = courseQuery.rows[0].course_code;

      // Delete from current campus
      const result = await client.query(
        'DELETE FROM courses WHERE course_id = $1 AND campus_name = $2 RETURNING *',
        [courseId, campus]
      );

      // Sync deletion to other campus if course_code exists
      if (courseCode) {
        const otherCampus = campus === 'west' ? 'twon' : 'west';
        const otherPool = getPool(otherCampus);
        const otherClient = await otherPool.connect();

        try {
          // Delete the same course on the other campus by course_code
          await otherClient.query(
            'DELETE FROM courses WHERE course_code = $1 AND campus_name = $2',
            [courseCode, otherCampus]
          );
          console.log(`✅ Course deleted from ${otherCampus} campus: ${courseCode}`);
        } catch (syncError) {
          console.error(`⚠️  Failed to delete course from ${otherCampus}:`, syncError.message);
        } finally {
          otherClient.release();
        }
      }

      res.json({ success: true, message: 'Course deleted successfully from both campuses' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update course
app.put('/api/:campus/courses/:courseId', async (req, res) => {
  try {
    const { campus, courseId } = req.params;
    const { course_name, name, course_code, department, fee_per_term, fee_per_year, duration_years, is_active, minimum_kcse_grade, fee_structure_pdf_name } = req.body;
    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      // Update course on current campus
      const result = await client.query(
        `UPDATE courses 
         SET course_name = $1, course_code = $2, department = $3, fee_per_term = $4, 
             fee_per_year = $5, duration_years = $6, is_active = $7, minimum_kcse_grade = $8,
             fee_structure_pdf_name = COALESCE($9, fee_structure_pdf_name),
             department_id = $10
         WHERE course_id = $11 AND campus_name = $12 RETURNING *`,
        [
          course_name || name, course_code, department, fee_per_term, fee_per_year,
          duration_years, is_active, minimum_kcse_grade, fee_structure_pdf_name,
          req.body.department_id, courseId, campus
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }

      const updatedCourse = result.rows[0];

      // Sync to other campus if course_code exists
      if (course_code) {
        const otherCampus = campus === 'west' ? 'twon' : 'west';
        const otherPool = getPool(otherCampus);
        const otherClient = await otherPool.connect();

        try {
          // Update the same course on the other campus by course_code
          await otherClient.query(
            `UPDATE courses 
             SET course_name = $1, course_code = $2, department = $3, fee_per_term = $4, 
                 fee_per_year = $5, duration_years = $6, is_active = $7, minimum_kcse_grade = $8,
                 fee_structure_pdf_name = COALESCE($9, fee_structure_pdf_name)
             WHERE course_code = $10 AND campus_name = $11`,
            [
              course_name || name, course_code, department, fee_per_term, fee_per_year,
              duration_years, is_active, minimum_kcse_grade, fee_structure_pdf_name,
              course_code, otherCampus
            ]
          );
          console.log(`✅ Course synced to ${otherCampus} campus: ${course_code}`);
        } catch (syncError) {
          console.error(`⚠️  Failed to sync course to ${otherCampus}:`, syncError.message);
        } finally {
          otherClient.release();
        }
      }

      res.json({ success: true, message: 'Course updated successfully on both campuses', data: updatedCourse });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete student
app.delete('/api/:campus/students/:studentId', async (req, res) => {
  try {
    const { campus, studentId } = req.params;
    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      // Check if studentId is numeric to avoid type error in SQL
      const isNumeric = /^\d+$/.test(studentId);
      let result;

      if (isNumeric) {
        result = await client.query(
          'DELETE FROM students WHERE student_id = $1 AND campus_name = $2 RETURNING *',
          [parseInt(studentId), campus]
        );
      } else {
        // Assume it's an admission number
        result = await client.query(
          'DELETE FROM students WHERE admission_number = $1 AND campus_name = $2 RETURNING *',
          [studentId, campus]
        );
      }

      if (result.rows.length === 0 && isNumeric) {
        // If numeric ID didn't work, try as admission number just in case
        const resultAdm = await client.query(
          'DELETE FROM students WHERE admission_number = $1 AND campus_name = $2 RETURNING *',
          [studentId, campus]
        );

        if (resultAdm.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Student not found' });
        }
      } else if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }

      res.json({ success: true, message: 'Student deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update student status (approve/reject)
app.put('/api/:campus/students/:studentId/status', async (req, res) => {
  try {
    const campus = req.params.campus;
    const studentId = req.params.studentId;
    const { status } = req.body;

    const pool = getPool(campus);
    const client = await pool.connect();

    try {
      const isNumeric = /^\d+$/.test(studentId);
      let result;

      if (isNumeric) {
        result = await client.query(
          'UPDATE students SET status = $1, updated_at = NOW() WHERE student_id = $2 AND campus_name = $3 RETURNING *',
          [status, parseInt(studentId), campus]
        );
      } else {
        result = await client.query(
          'UPDATE students SET status = $1, updated_at = NOW() WHERE admission_number = $2 AND campus_name = $3 RETURNING *',
          [status, studentId, campus]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }

      res.json({
        success: true,
        message: `Student status updated to ${status}`,
        data: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update student status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add course to both campuses
app.post('/api/courses/add-to-both', async (req, res) => {
  try {
    const courseData = req.body;

    // Get next course IDs for both campuses
    const twonClient = await twonPool.connect();
    const westClient = await westPool.connect();

    try {
      // Get max course_id from each campus
      const twonResult = await twonClient.query('SELECT MAX(course_id) as max_id FROM courses WHERE campus_name = \'twon\'');
      const westResult = await westClient.query('SELECT MAX(course_id) as max_id FROM courses WHERE campus_name = \'west\'');

      const twonNextId = (twonResult.rows[0].max_id || 0) + 1;
      const westNextId = (westResult.rows[0].max_id || 0) + 1;

      // Add course to Twon Campus
      await twonClient.query(`
        INSERT INTO courses(
        course_id, course_name, course_code, department,
        fee_per_term, fee_per_year, duration_years, minimum_kcse_grade,
        fee_structure_pdf_name, campus_name
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, 'twon')
        `, [
        twonNextId, courseData.course_name, courseData.course_code,
        courseData.department, courseData.fee_per_term, courseData.fee_per_year,
        courseData.duration_years, courseData.minimum_kcse_grade,
        courseData.fee_structure_pdf_name
      ]);

      // Add course to West Campus
      await westClient.query(`
        INSERT INTO courses(
          course_id, course_name, course_code, department,
          fee_per_term, fee_per_year, duration_years, minimum_kcse_grade,
          fee_structure_pdf_name, campus_name
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, 'west')
      `, [
        westNextId, courseData.course_name, courseData.course_code,
        courseData.department, courseData.fee_per_term, courseData.fee_per_year,
        courseData.duration_years, courseData.minimum_kcse_grade,
        courseData.fee_structure_pdf_name
      ]);

      res.json({
        success: true,
        message: 'Course added successfully to both campuses',
        data: {
          twon_course_id: twonNextId,
          west_course_id: westNextId
        }
      });

    } finally {
      twonClient.release();
      westClient.release();
    }

  } catch (error) {
    console.error('Add course to both campuses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Fee management routes
app.get('/api/:campus/fees', async (req, res) => {
  try {
    const dir = path.join(__dirname, 'backend', 'fee');
    if (!fs.existsSync(dir)) {
      return res.json({ success: true, data: [] });
    }

    // Read files from directory
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

    // Sort by name
    files.sort();

    res.json({
      success: true,
      data: files.map(f => ({
        filename: f,
        displayName: f.split('_').slice(1).join('_') || f // Remove prefix if it exists
      }))
    });
  } catch (error) {
    console.error('Error listing fees:', error);
    res.status(500).json({ success: false, error: 'Failed to list fee PDFs' });
  }
});

app.post('/api/:campus/fees/upload', uploadFee.single('feePdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    res.json({
      success: true,
      message: 'Fee PDF uploaded successfully',
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading fee PDF:', error);
    res.status(500).json({ success: false, error: 'Failed to upload fee PDF' });
  }
});

app.get('/api/:campus/fees/download/:filename', (req, res) => {
  const { filename } = req.params;

  const localPath = path.join(__dirname, 'backend', 'fee', filename);
  const tmpPath = path.join('/tmp', 'fee', filename);

  if (fs.existsSync(localPath)) {
    res.sendFile(localPath);
  } else if (fs.existsSync(tmpPath)) {
    res.sendFile(tmpPath);
  } else {
    res.status(404).json({ success: false, error: 'Fee PDF not found' });
  }
});

// API test routes
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API working' });
});

app.get('/api/twon/test', (req, res) => {
  res.json({ success: true, campus: 'twon' });
});

app.get('/api/west/test', (req, res) => {
  res.json({ success: true, campus: 'west' });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`👨‍🎓 Student: http://localhost:${PORT}/student`);
  console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin`);
});

module.exports = app;

-- =============================
-- College Admission System Unified Schema
-- =============================

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS admins (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    campus_name VARCHAR(50) NOT NULL, -- campus this admin manages
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Campus Settings Table
CREATE TABLE IF NOT EXISTS campus_settings (
    campus_id SERIAL PRIMARY KEY,
    campus_name VARCHAR(50) NOT NULL UNIQUE,
    admission_number_format VARCHAR(50) NOT NULL, -- e.g., "TWON-2025-{seq}"
    admission_starting_number INT NOT NULL DEFAULT 1001,
    current_sequence_number INT NOT NULL DEFAULT 1001,
    reporting_date_term1 DATE,
    reporting_date_term2 DATE,
    reporting_date_term3 DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    department_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    campus_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    department_id INTEGER REFERENCES departments(department_id),
    department VARCHAR(100) NOT NULL,
    fee_per_term DECIMAL(10,2),
    fee_per_year DECIMAL(10,2),
    duration_years INTEGER NOT NULL,
    fee_structure_pdf_name VARCHAR(255), -- stores only PDF name
    campus_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    admission_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    email VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    phone_number VARCHAR(20),
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    department VARCHAR(100),
    course_id INTEGER REFERENCES courses(course_id),
    campus_name VARCHAR(50) NOT NULL, -- selected by student or auto-set by admin
    reporting_date DATE,
    fee_balance_per_term DECIMAL(10,2) DEFAULT 0,
    total_fee DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending', -- pending, admitted, rejected
    pdf_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
    session_id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(admin_id),
    token VARCHAR(500) NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Admin Activities Log
CREATE TABLE IF NOT EXISTS admin_activities (
    activity_id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(admin_id),
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Admission History Table
CREATE TABLE IF NOT EXISTS admission_history (
    history_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(student_id),
    action VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- Indexes for better performance
-- =============================

CREATE INDEX IF NOT EXISTS idx_admins_campus ON admins(campus_name);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_activities_admin_id ON admin_activities(admin_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_campus ON students(campus_name);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_reporting_date ON students(reporting_date);
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_campus ON courses(campus_name);
CREATE INDEX IF NOT EXISTS idx_departments_campus ON departments(campus_name);

-- =============================
-- Functions for Admission Number Generation
-- =============================

-- Function to generate next admission number for a campus
CREATE OR REPLACE FUNCTION generate_admission_number(p_campus_name VARCHAR(50))
RETURNS VARCHAR(50) AS $$
DECLARE
    v_format VARCHAR(50);
    v_sequence_number INTEGER;
    v_admission_number VARCHAR(50);
BEGIN
    -- Get campus settings
    SELECT admission_number_format, current_sequence_number 
    INTO v_format, v_sequence_number
    FROM campus_settings 
    WHERE campus_name = p_campus_name;
    
    -- If no settings found, create default
    IF v_format IS NULL THEN
        v_format := UPPER(p_campus_name) || '-{year}-{seq}';
        v_sequence_number := 1001;
        
        INSERT INTO campus_settings (campus_name, admission_number_format, current_sequence_number)
        VALUES (p_campus_name, v_format, v_sequence_number);
    END IF;
    
    -- Generate admission number (replace {year} and {seq})
    v_admission_number := REPLACE(
        REPLACE(v_format, '{seq}', v_sequence_number::TEXT),
        '{year}', 
        TO_CHAR(CURRENT_DATE, 'YYYY')
    );
    
    -- Update sequence number for next admission
    UPDATE campus_settings 
    SET current_sequence_number = current_sequence_number + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE campus_name = p_campus_name;
    
    RETURN v_admission_number;
END;
$$ LANGUAGE plpgsql;

-- Function to assign reporting date based on term
CREATE OR REPLACE FUNCTION assign_reporting_date(p_campus_name VARCHAR(50), p_term INTEGER DEFAULT 1)
RETURNS DATE AS $$
DECLARE
    v_reporting_date DATE;
BEGIN
    CASE p_term
        WHEN 1 THEN
            SELECT reporting_date_term1 INTO v_reporting_date
            FROM campus_settings 
            WHERE campus_name = p_campus_name;
        WHEN 2 THEN
            SELECT reporting_date_term2 INTO v_reporting_date
            FROM campus_settings 
            WHERE campus_name = p_campus_name;
        WHEN 3 THEN
            SELECT reporting_date_term3 INTO v_reporting_date
            FROM campus_settings 
            WHERE campus_name = p_campus_name;
        ELSE
            v_reporting_date := NULL;
    END CASE;
    
    RETURN v_reporting_date;
END;
$$ LANGUAGE plpgsql;

-- =============================
-- Trigger for automatic admission number generation
-- =============================

-- Function to automatically generate admission number when student is created
CREATE OR REPLACE FUNCTION auto_generate_admission_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.admission_number IS NULL OR NEW.admission_number = '' THEN
        NEW.admission_number := generate_admission_number(NEW.campus_name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate admission number
CREATE TRIGGER trigger_auto_generate_admission_number
    BEFORE INSERT ON students
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_admission_number();

-- =============================
-- Sample Data Insertion (Optional)
-- =============================

-- Insert sample campus settings
INSERT INTO campus_settings (campus_name, admission_number_format, admission_starting_number, current_sequence_number, reporting_date_term1, reporting_date_term2, reporting_date_term3)
VALUES 
    ('twon', 'TWON-{year}-{seq}', 1001, 1001, CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '4 months', CURRENT_DATE + INTERVAL '8 months'),
    ('west', 'WEST-{year}-{seq}', 2001, 2001, CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '4 months', CURRENT_DATE + INTERVAL '8 months')
ON CONFLICT (campus_name) DO NOTHING;

-- Insert sample admin users
INSERT INTO admins (username, password, campus_name, email)
VALUES 
    ('twon_admin', '$2b$10$placeholder_hash', 'twon', 'admin@twon.edu'),
    ('west_admin', '$2b$10$placeholder_hash', 'west', 'admin@west.edu')
ON CONFLICT (username) DO NOTHING;

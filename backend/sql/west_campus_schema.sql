-- West Campus Database Schema

-- Enhanced Admins table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  campus VARCHAR(20) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin sessions for JWT token management
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admins(id),
  token VARCHAR(500) NOT NULL,
  device_info TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin activities log
CREATE TABLE IF NOT EXISTS admin_activities (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admins(id),
  action VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  department_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  campus VARCHAR(20) DEFAULT 'west',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  course_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  department_id INTEGER REFERENCES departments(id),
  fee_per_term DECIMAL(10, 2) NOT NULL,
  fee_per_year DECIMAL(10, 2) NOT NULL,
  duration_years INTEGER NOT NULL,
  campus VARCHAR(20) DEFAULT 'west',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  admission_number VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  address TEXT,
  course_id INTEGER REFERENCES courses(id),
  campus VARCHAR(20) DEFAULT 'west',
  admission_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, admitted, rejected
  pdf_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admission history table
CREATE TABLE IF NOT EXISTS admission_history (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  action VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admins_campus ON admins(campus);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_activities_admin_id ON admin_activities(admin_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_students_campus ON students(campus);
CREATE INDEX IF NOT EXISTS idx_courses_campus ON courses(campus);

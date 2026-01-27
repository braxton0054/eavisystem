-- Add KCSE Grade Fields to Courses and Students Tables
-- This script updates both Twon and West campus databases

-- ========================================
-- UPDATE COURSES TABLE
-- ========================================

-- Add minimum_kcse_grade column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS minimum_kcse_grade VARCHAR(10) DEFAULT 'C−';

-- Add comments to the new column
COMMENT ON COLUMN courses.minimum_kcse_grade IS 'Minimum KCSE grade required for admission to this course';

-- Update existing courses with default minimum grades
UPDATE courses 
SET minimum_kcse_grade = CASE 
    -- Engineering courses require higher grades
    WHEN course_code IN ('AE101', 'CE101', 'ME101', 'MELT101', 'MW101', 'MEP101') THEN 'B−'
    
    -- Medical and health courses require higher grades  
    WHEN course_code IN ('POTT101', 'OTM101', 'PHL101', 'CNA101', 'BLS101', 'HCN101', 'MW101') THEN 'C+'
    
    -- Business and management courses
    WHEN course_code IN ('BSE', 'BAM101', 'FMNGO101', 'HRM101', 'PA101') THEN 'C−'
    
    -- ICT courses
    WHEN course_code IN ('IT101', 'IS101') THEN 'C−'
    
    -- General courses with lower requirements
    ELSE 'C−'
END
WHERE minimum_kcse_grade IS NULL OR minimum_kcse_grade = '';

-- ========================================
-- UPDATE STUDENTS TABLE  
-- ========================================

-- Add kcse_grade column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS kcse_grade VARCHAR(10);

-- Add comments to the new column
COMMENT ON COLUMN students.kcse_grade IS 'KCSE grade obtained by the student';

-- ========================================
-- CREATE INDEXES FOR NEW FIELDS
-- ========================================

-- Create index for kcse_grade in courses table
CREATE INDEX IF NOT EXISTS idx_courses_minimum_kcse_grade ON courses(minimum_kcse_grade);

-- Create index for kcse_grade in students table  
CREATE INDEX IF NOT EXISTS idx_students_kcse_grade ON students(kcse_grade);

-- ========================================
-- SAMPLE DATA UPDATES (OPTIONAL)
-- ========================================

-- Update some existing students with sample KCSE grades (for testing)
-- This section can be removed in production
UPDATE students 
SET kcse_grade = CASE 
    WHEN id % 6 = 0 THEN 'A'
    WHEN id % 6 = 1 THEN 'A−'
    WHEN id % 6 = 2 THEN 'B+'
    WHEN id % 6 = 3 THEN 'B'
    WHEN id % 6 = 4 THEN 'C+'
    WHEN id % 6 = 5 THEN 'C'
    ELSE 'C−'
END
WHERE kcse_grade IS NULL AND id <= 20;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Display courses with their new minimum KCSE grades
SELECT 
    course_code,
    name,
    department_id,
    minimum_kcse_grade,
    fee_per_term,
    duration_years
FROM courses 
ORDER BY course_code;

-- Display students with KCSE grades
SELECT 
    admission_number,
    full_name,
    kcse_grade,
    course_id,
    status,
    admission_date
FROM students 
WHERE kcse_grade IS NOT NULL
ORDER BY admission_date DESC
LIMIT 10;

-- Display summary statistics
SELECT 
    COUNT(*) as total_students,
    COUNT(CASE WHEN kcse_grade IS NOT NULL THEN 1 END) as students_with_kcse_grade,
    COUNT(CASE WHEN kcse_grade IS NULL THEN 1 END) as students_without_kcse_grade
FROM students;

SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN minimum_kcse_grade IS NOT NULL THEN 1 END) as courses_with_min_grade,
    COUNT(CASE WHEN minimum_kcse_grade IS NULL THEN 1 END) as courses_without_min_grade
FROM courses;

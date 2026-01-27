const { Pool } = require('pg');

// Database connections
const twonPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_j8sw4iKqRWgu@ep-snowy-math-ahqrtk3r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

const westPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_qoQV16dcCxmp@ep-royal-dew-ahi5hxv4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

// Course data with departments and fees
const coursesByDepartment = [
  // Department of Health Sciences
  {
    department: 'Department of Health Sciences',
    courses: [
      { name: 'Peri-operative Theatre Technology', code: 'POTT101', fee_per_term: 2500, fee_per_year: 7500, duration: 3 },
      { name: 'Orthopaedic and Trauma Medicine', code: 'OTM101', fee_per_term: 2800, fee_per_year: 8400, duration: 3 },
      { name: 'Dental Assistant', code: 'DA101', fee_per_term: 2000, fee_per_year: 6000, duration: 2 },
      { name: 'Phlebotomy', code: 'PHL101', fee_per_term: 1800, fee_per_year: 5400, duration: 2 },
      { name: 'Certified Nurse Assistant (CNA)', code: 'CNA101', fee_per_term: 2200, fee_per_year: 6600, duration: 2 },
      { name: 'Basic Life Support (BLS)', code: 'BLS101', fee_per_term: 1200, fee_per_year: 3600, duration: 1 },
      { name: 'Home Care Nursing', code: 'HCN101', fee_per_term: 2100, fee_per_year: 6300, duration: 2 },
      { name: 'Health Services Support', code: 'HSS101', fee_per_term: 1900, fee_per_year: 5700, duration: 2 },
      { name: 'Health Care Assistant', code: 'HCA101', fee_per_term: 2000, fee_per_year: 6000, duration: 2 },
      { name: 'Individual Support', code: 'IS101', fee_per_term: 1600, fee_per_year: 4800, duration: 1 },
      { name: 'Caregiver', code: 'CG101', fee_per_term: 1700, fee_per_year: 5100, duration: 1 },
      { name: 'Nurse Aide', code: 'NA101', fee_per_term: 1800, fee_per_year: 5400, duration: 1 },
      { name: 'Patient Attendant', code: 'PA101', fee_per_term: 1500, fee_per_year: 4500, duration: 1 },
      { name: 'Midwifery', code: 'MW101', fee_per_term: 3000, fee_per_year: 9000, duration: 3 },
      { name: 'Community Health Assistant', code: 'CHA101', fee_per_term: 2000, fee_per_year: 6000, duration: 2 },
      { name: 'Public Health', code: 'PH101', fee_per_term: 2600, fee_per_year: 7800, duration: 3 },
      { name: 'Health Records Management with ICT', code: 'HRM101', fee_per_term: 2300, fee_per_year: 6900, duration: 2 },
      { name: 'HIV/AIDS Management', code: 'HAM101', fee_per_term: 1900, fee_per_year: 5700, duration: 2 },
      { name: 'HIV/AIDS Testing and Counseling (HTC)', code: 'HTC101', fee_per_term: 1700, fee_per_year: 5100, duration: 1 }
    ]
  },
  
  // Department of Mortuary & Forensic Sciences
  {
    department: 'Department of Mortuary & Forensic Sciences',
    courses: [
      { name: 'Morgue Attendant', code: 'MA101', fee_per_term: 2200, fee_per_year: 6600, duration: 2 },
      { name: 'Mortuary Science', code: 'MS101', fee_per_term: 3500, fee_per_year: 10500, duration: 3 }
    ]
  },
  
  // Department of Child & Social Development
  {
    department: 'Department of Child & Social Development',
    courses: [
      { name: 'Child Care and Protection', code: 'CCP101', fee_per_term: 1800, fee_per_year: 5400, duration: 2 },
      { name: 'Community Development and Social Work', code: 'CDSW101', fee_per_term: 2100, fee_per_year: 6300, duration: 2 },
      { name: 'Community Health and Social Work', code: 'CHSW101', fee_per_term: 2300, fee_per_year: 6900, duration: 2 }
    ]
  },
  
  // Department of Beauty, Fashion & Design
  {
    department: 'Department of Beauty, Fashion & Design',
    courses: [
      { name: 'Hairdressing and Beauty Therapy', code: 'HBT101', fee_per_term: 2000, fee_per_year: 6000, duration: 2 },
      { name: 'Fashion and Design', code: 'FD101', fee_per_term: 2200, fee_per_year: 6600, duration: 2 },
      { name: 'Garment Making', code: 'GM101', fee_per_term: 1800, fee_per_year: 5400, duration: 1 }
    ]
  },
  
  // Department of Hospitality & Tourism Management
  {
    department: 'Department of Hospitality & Tourism Management',
    courses: [
      { name: 'Catering / Food and Beverage Management', code: 'CFB101', fee_per_term: 2400, fee_per_year: 7200, duration: 2 },
      { name: 'Culinary Arts', code: 'CA101', fee_per_term: 2600, fee_per_year: 7800, duration: 2 },
      { name: 'Hotel and Hospitality Management', code: 'HHM101', fee_per_term: 2800, fee_per_year: 8400, duration: 3 },
      { name: 'Tourism Management', code: 'TM101', fee_per_term: 2500, fee_per_year: 7500, duration: 3 },
      { name: 'Customer Care / Front Office Management', code: 'CCF101', fee_per_term: 1900, fee_per_year: 5700, duration: 1 }
    ]
  },
  
  // Department of Education
  {
    department: 'Department of Education',
    courses: [
      { name: 'Teacher Education', code: 'TE101', fee_per_term: 2200, fee_per_year: 6600, duration: 2 },
      { name: 'Training of Trainers (TOT)', code: 'TOT101', fee_per_term: 2000, fee_per_year: 6000, duration: 1 }
    ]
  },
  
  // Department of Social Sciences & Counseling
  {
    department: 'Department of Social Sciences & Counseling',
    courses: [
      { name: 'Social Work and Nurse Aide', code: 'SWNA101', fee_per_term: 2100, fee_per_year: 6300, duration: 2 },
      { name: 'Guidance and Counseling Skills Development', code: 'GCSD101', fee_per_term: 1900, fee_per_year: 5700, duration: 1 },
      { name: 'Counseling Psychology', code: 'CP101', fee_per_term: 2400, fee_per_year: 7200, duration: 2 },
      { name: 'Counseling', code: 'C101', fee_per_term: 2000, fee_per_year: 6000, duration: 1 },
      { name: 'Gender and Development Studies', code: 'GDS101', fee_per_term: 1800, fee_per_year: 5400, duration: 1 }
    ]
  },
  
  // Department of Business & Management Studies
  {
    department: 'Department of Business & Management Studies',
    courses: [
      { name: 'Business Administration and Management', code: 'BAM101', fee_per_term: 2500, fee_per_year: 7500, duration: 3 },
      { name: 'Finance and Banking', code: 'FB101', fee_per_term: 2600, fee_per_year: 7800, duration: 3 },
      { name: 'Sales and Marketing', code: 'SM101', fee_per_term: 2300, fee_per_year: 6900, duration: 2 },
      { name: 'Entrepreneurship', code: 'ENT101', fee_per_term: 2000, fee_per_year: 6000, duration: 1 },
      { name: 'Human Resource Management (HRM)', code: 'HRM101', fee_per_term: 2400, fee_per_year: 7200, duration: 2 },
      { name: 'Purchasing and Supply Management', code: 'PSM101', fee_per_term: 2200, fee_per_year: 6600, duration: 2 },
      { name: 'Store Keeping', code: 'SK101', fee_per_term: 1800, fee_per_year: 5400, duration: 1 },
      { name: 'Logistics and Procurement Management', code: 'LPM101', fee_per_term: 2600, fee_per_year: 7800, duration: 2 },
      { name: 'NGO Management', code: 'NGO101', fee_per_term: 2300, fee_per_year: 6900, duration: 2 },
      { name: 'Financial Management for NGOs', code: 'FMNGO101', fee_per_term: 2400, fee_per_year: 7200, duration: 2 },
      { name: 'Monitoring and Evaluation of Projects', code: 'MEP101', fee_per_term: 2200, fee_per_year: 6600, duration: 1 }
    ]
  },
  
  // Department of Public Administration & Governance
  {
    department: 'Department of Public Administration & Governance',
    courses: [
      { name: 'Public Administration and Relations', code: 'PAR101', fee_per_term: 2300, fee_per_year: 6900, duration: 2 },
      { name: 'Leadership Skills Development', code: 'LSD101', fee_per_term: 1900, fee_per_year: 5700, duration: 1 },
      { name: 'Conflict Management and Peace Building', code: 'CMPB101', fee_per_term: 2100, fee_per_year: 6300, duration: 1 }
    ]
  },
  
  // Department of ICT & Information Science
  {
    department: 'Department of ICT & Information Science',
    courses: [
      { name: 'Computer Packages / IT / ICT / Information Science', code: 'IT101', fee_per_term: 2000, fee_per_year: 6000, duration: 2 }
    ]
  },
  
  // Department of Engineering & Technical Studies
  {
    department: 'Department of Engineering & Technical Studies',
    courses: [
      { name: 'Electrical Engineering', code: 'EE101', fee_per_term: 3000, fee_per_year: 9000, duration: 3 },
      { name: 'Civil Engineering / Building Construction / Survey', code: 'CE101', fee_per_term: 3200, fee_per_year: 9600, duration: 3 },
      { name: 'Water Engineering and Plumbing', code: 'WEP101', fee_per_term: 2800, fee_per_year: 8400, duration: 3 },
      { name: 'Mechanical Engineering', code: 'ME101', fee_per_term: 3500, fee_per_year: 10500, duration: 3 },
      { name: 'Automotive Engineering', code: 'AE101', fee_per_term: 3000, fee_per_year: 9000, duration: 3 },
      { name: 'Medical Engineering and Laboratory Technology', code: 'MELT101', fee_per_term: 4000, fee_per_year: 12000, duration: 4 }
    ]
  },
  
  // Department of Agriculture & Environmental Studies
  {
    department: 'Department of Agriculture & Environmental Studies',
    courses: [
      { name: 'General Agriculture', code: 'GA101', fee_per_term: 2200, fee_per_year: 6600, duration: 2 }
    ]
  },
  
  // Department of Security & Criminology
  {
    department: 'Department of Security & Criminology',
    courses: [
      { name: 'Security Management', code: 'SM101', fee_per_term: 2100, fee_per_year: 6300, duration: 2 },
      { name: 'Criminology', code: 'CR101', fee_per_term: 2300, fee_per_year: 6900, duration: 2 }
    ]
  },
  
  // Department of Disaster & Emergency Management
  {
    department: 'Department of Disaster & Emergency Management',
    courses: [
      { name: 'Disaster Management', code: 'DM101', fee_per_term: 2400, fee_per_year: 7200, duration: 2 }
    ]
  }
];

async function addAllCourses() {
  console.log('📚 Adding All Courses to Both Campuses...\n');

  try {
    // Add courses to Twon Campus
    console.log('🏫 Adding courses to Twon Campus...');
    const twonClient = await twonPool.connect();
    let twonCourseId = 4; // Start from 4 since we already have 3 courses
    
    for (const dept of coursesByDepartment) {
      console.log(`\n📋 Department: ${dept.department}`);
      
      for (const course of dept.courses) {
        try {
          await twonClient.query(`
            INSERT INTO courses (
              course_id, course_name, course_code, department, 
              fee_per_term, fee_per_year, duration_years, campus_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'twon')
            ON CONFLICT (course_id) DO UPDATE SET
              course_name = EXCLUDED.course_name,
              course_code = EXCLUDED.course_code,
              department = EXCLUDED.department,
              fee_per_term = EXCLUDED.fee_per_term,
              fee_per_year = EXCLUDED.fee_per_year,
              duration_years = EXCLUDED.duration_years
          `, [
            twonCourseId, course.name, course.code, dept.department,
            course.fee_per_term, course.fee_per_year, course.duration
          ]);
          
          console.log(`  ✅ ${course.name} (${course.code}) - $${course.fee_per_term}/term`);
          twonCourseId++;
        } catch (error) {
          console.log(`  ⚠️  Skipped: ${course.name} (${error.message})`);
        }
      }
    }
    
    twonClient.release();

    // Add courses to West Campus
    console.log('\n\n🏫 Adding courses to West Campus...');
    const westClient = await westPool.connect();
    let westCourseId = 4; // Start from 4 since we already have 3 courses
    
    for (const dept of coursesByDepartment) {
      console.log(`\n📋 Department: ${dept.department}`);
      
      for (const course of dept.courses) {
        try {
          await westClient.query(`
            INSERT INTO courses (
              course_id, course_name, course_code, department, 
              fee_per_term, fee_per_year, duration_years, campus_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'west')
            ON CONFLICT (course_id) DO UPDATE SET
              course_name = EXCLUDED.course_name,
              course_code = EXCLUDED.course_code,
              department = EXCLUDED.department,
              fee_per_term = EXCLUDED.fee_per_term,
              fee_per_year = EXCLUDED.fee_per_year,
              duration_years = EXCLUDED.duration_years
          `, [
            westCourseId, course.name, course.code, dept.department,
            course.fee_per_term, course.fee_per_year, course.duration
          ]);
          
          console.log(`  ✅ ${course.name} (${course.code}) - $${course.fee_per_term}/term`);
          westCourseId++;
        } catch (error) {
          console.log(`  ⚠️  Skipped: ${course.name} (${error.message})`);
        }
      }
    }
    
    westClient.release();

    // Count total courses
    const totalCourses = coursesByDepartment.reduce((sum, dept) => sum + dept.courses.length, 0);
    
    console.log('\n🎉 All Courses Added Successfully!');
    console.log('\n📊 Summary:');
    console.log(`📚 Total Departments: ${coursesByDepartment.length}`);
    console.log(`📚 Total Courses: ${totalCourses}`);
    console.log(`📚 Courses per campus: ${totalCourses} (Twon) + ${totalCourses} (West) = ${totalCourses * 2}`);
    
    console.log('\n💰 Fee Range:');
    console.log(`Lowest: $1,200/year (Basic Life Support)`);
    console.log(`Highest: $12,000/year (Medical Engineering and Laboratory Technology)`);
    
    console.log('\n🎯 Duration Range:');
    console.log(`Shortest: 1 year (Certificate courses)`);
    console.log(`Longest: 4 years (Medical Engineering)`);
    
    console.log('\n🌐 Test in UI:');
    console.log('1. Restart server: npm start');
    console.log('2. Go to: http://localhost:3000/admin');
    console.log('3. Login with campus password');
    console.log('4. Check Courses section');

  } catch (error) {
    console.error('❌ Error adding courses:', error);
  } finally {
    await twonPool.end();
    await westPool.end();
  }
}

addAllCourses();

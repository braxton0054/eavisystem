const { Pool } = require('pg');

// Database connections
const twonPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_j8sw4iKqRWgu@ep-snowy-math-ahqrtk3r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

const westPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_qoQV16dcCxmp@ep-royal-dew-ahi5hxv4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function addSampleStudents() {
  console.log('🎓 Adding Sample Students to Both Campuses...\n');

  try {
    // Add sample students to Twon Campus
    console.log('🏫 Adding students to Twon Campus...');
    const twonClient = await twonPool.connect();
    
    const twonStudents = [
      {
        admission_number: 'TWON-2025-1001',
        full_name: 'Alice Johnson',
        email: 'alice.johnson@twon.edu',
        phone_number: '+254712345678',
        date_of_birth: '2000-05-15',
        location: 'Nairobi, Kenya',
        course_id: 1,
        campus_name: 'twon',
        admission_date: '2025-01-15',
        reporting_date: '2025-01-15',
        fee_balance_per_term: 1500.00,
        total_fee: 4500.00,
        status: 'admitted'
      },
      {
        admission_number: 'TWON-2025-1002',
        full_name: 'Bob Smith',
        email: 'bob.smith@twon.edu',
        phone_number: '+254723456789',
        date_of_birth: '2001-03-20',
        location: 'Mombasa, Kenya',
        course_id: 2,
        campus_name: 'twon',
        admission_date: '2025-01-16',
        reporting_date: '2025-01-16',
        fee_balance_per_term: 1600.00,
        total_fee: 4800.00,
        status: 'pending'
      },
      {
        admission_number: 'TWON-2025-1003',
        full_name: 'Carol Williams',
        email: 'carol.williams@twon.edu',
        phone_number: '+254734567890',
        date_of_birth: '2000-08-10',
        location: 'Kisumu, Kenya',
        course_id: 3,
        campus_name: 'twon',
        admission_date: '2025-01-17',
        reporting_date: '2025-01-17',
        fee_balance_per_term: 1400.00,
        total_fee: 4200.00,
        status: 'admitted'
      }
    ];

    for (const student of twonStudents) {
      try {
        await twonClient.query(`
          INSERT INTO students (
            admission_number, full_name, email, phone_number, date_of_birth,
            location, course_id, campus_name, admission_date, reporting_date,
            fee_balance_per_term, total_fee, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (admission_number) DO NOTHING
        `, [
          student.admission_number, student.full_name, student.email,
          student.phone_number, student.date_of_birth, student.location,
          student.course_id, student.campus_name, student.admission_date,
          student.reporting_date, student.fee_balance_per_term,
          student.total_fee, student.status
        ]);
        console.log(`✅ Added: ${student.full_name} (${student.admission_number})`);
      } catch (error) {
        console.log(`⚠️  Skipped: ${student.full_name} (already exists)`);
      }
    }

    twonClient.release();

    // Add sample students to West Campus
    console.log('\n🏫 Adding students to West Campus...');
    const westClient = await westPool.connect();
    
    const westStudents = [
      {
        admission_number: 'WEST-2025-2001',
        full_name: 'David Brown',
        email: 'david.brown@west.edu',
        phone_number: '+254745678901',
        date_of_birth: '2000-12-05',
        location: 'Nakuru, Kenya',
        course_id: 1,
        campus_name: 'west',
        admission_date: '2025-01-20',
        reporting_date: '2025-01-20',
        fee_balance_per_term: 1800.00,
        total_fee: 5400.00,
        status: 'admitted'
      },
      {
        admission_number: 'WEST-2025-2002',
        full_name: 'Emma Davis',
        email: 'emma.davis@west.edu',
        phone_number: '+254756789012',
        date_of_birth: '2001-07-25',
        location: 'Eldoret, Kenya',
        course_id: 2,
        campus_name: 'west',
        admission_date: '2025-01-21',
        reporting_date: '2025-01-21',
        fee_balance_per_term: 1700.00,
        total_fee: 5100.00,
        status: 'pending'
      },
      {
        admission_number: 'WEST-2025-2003',
        full_name: 'Frank Miller',
        email: 'frank.miller@west.edu',
        phone_number: '+254767890123',
        date_of_birth: '2000-09-18',
        location: 'Thika, Kenya',
        course_id: 3,
        campus_name: 'west',
        admission_date: '2025-01-22',
        reporting_date: '2025-01-22',
        fee_balance_per_term: 1650.00,
        total_fee: 4950.00,
        status: 'admitted'
      }
    ];

    for (const student of westStudents) {
      try {
        await westClient.query(`
          INSERT INTO students (
            admission_number, full_name, email, phone_number, date_of_birth,
            location, course_id, campus_name, admission_date, reporting_date,
            fee_balance_per_term, total_fee, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (admission_number) DO NOTHING
        `, [
          student.admission_number, student.full_name, student.email,
          student.phone_number, student.date_of_birth, student.location,
          student.course_id, student.campus_name, student.admission_date,
          student.reporting_date, student.fee_balance_per_term,
          student.total_fee, student.status
        ]);
        console.log(`✅ Added: ${student.full_name} (${student.admission_number})`);
      } catch (error) {
        console.log(`⚠️  Skipped: ${student.full_name} (already exists)`);
      }
    }

    westClient.release();

    // Add sample courses if they don't exist
    console.log('\n📚 Adding sample courses...');
    
    // Twon Campus courses
    const twonCourseClient = await twonPool.connect();
    const twonCourses = [
      { course_id: 1, course_name: 'Computer Science', course_code: 'CS101', department: 'Technology', fee_per_term: 1500.00, fee_per_year: 4500.00, duration_years: 4 },
      { course_id: 2, course_name: 'Software Engineering', course_code: 'SE101', department: 'Technology', fee_per_term: 1600.00, fee_per_year: 4800.00, duration_years: 4 },
      { course_id: 3, course_name: 'Information Technology', course_code: 'IT101', department: 'Technology', fee_per_term: 1400.00, fee_per_year: 4200.00, duration_years: 3 }
    ];

    for (const course of twonCourses) {
      try {
        await twonCourseClient.query(`
          INSERT INTO courses (course_id, course_name, course_code, department, fee_per_term, fee_per_year, duration_years, campus_name)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'twon')
          ON CONFLICT (course_id) DO NOTHING
        `, [course.course_id, course.course_name, course.course_code, course.department, course.fee_per_term, course.fee_per_year, course.duration_years]);
        console.log(`✅ Twon Course: ${course.course_name}`);
      } catch (error) {
        console.log(`⚠️  Twon Course already exists: ${course.course_name}`);
      }
    }
    twonCourseClient.release();

    // West Campus courses
    const westCourseClient = await westPool.connect();
    const westCourses = [
      { course_id: 1, course_name: 'Computer Science', course_code: 'CS101', department: 'Engineering', fee_per_term: 1800.00, fee_per_year: 5400.00, duration_years: 4 },
      { course_id: 2, course_name: 'Software Engineering', course_code: 'SE101', department: 'Engineering', fee_per_term: 1700.00, fee_per_year: 5100.00, duration_years: 4 },
      { course_id: 3, course_name: 'Information Technology', course_code: 'IT101', department: 'Engineering', fee_per_term: 1650.00, fee_per_year: 4950.00, duration_years: 3 }
    ];

    for (const course of westCourses) {
      try {
        await westCourseClient.query(`
          INSERT INTO courses (course_id, course_name, course_code, department, fee_per_term, fee_per_year, duration_years, campus_name)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'west')
          ON CONFLICT (course_id) DO NOTHING
        `, [course.course_id, course.course_name, course.course_code, course.department, course.fee_per_term, course.fee_per_year, course.duration_years]);
        console.log(`✅ West Course: ${course.course_name}`);
      } catch (error) {
        console.log(`⚠️  West Course already exists: ${course.course_name}`);
      }
    }
    westCourseClient.release();

    console.log('\n🎉 Sample Students and Courses Added Successfully!');
    console.log('\n📊 Summary:');
    console.log('Twon Campus: 3 students, 3 courses');
    console.log('West Campus: 3 students, 3 courses');
    console.log('\n🌐 Test in UI:');
    console.log('1. Start server: npm start');
    console.log('2. Go to: http://localhost:3000/admin');
    console.log('3. Login with campus password');
    console.log('4. Check student list in dashboard');

  } catch (error) {
    console.error('❌ Error adding sample students:', error);
  } finally {
    await twonPool.end();
    await westPool.end();
  }
}

addSampleStudents();

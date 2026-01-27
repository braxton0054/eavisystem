const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection strings
const WEST_DB_URL = 'postgresql://neondb_owner:npg_qoQV16dcCxmp@ep-royal-dew-ahi5hxv4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const TWON_DB_URL = 'postgresql://neondb_owner:npg_j8sw4iKqRWgu@ep-snowy-math-ahqrtk3r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Create database pools
const westPool = new Pool({ connectionString: WEST_DB_URL });
const twonPool = new Pool({ connectionString: TWON_DB_URL });

async function executeSqlFile(pool, dbName) {
    console.log(`\n🔧 Updating ${dbName} database...`);
    
    const client = await pool.connect();
    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, '..', 'sql', 'add-kcse-grade-fields.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Split the SQL content into individual statements
        const statements = sqlContent
            .split(/;\s*\n/g) // Split on semicolon followed by newline
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt.includes('(') || stmt.includes('ALTER') || stmt.includes('CREATE') || stmt.includes('INSERT') || stmt.includes('UPDATE') || stmt.includes('SELECT'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const statement of statements) {
            try {
                await client.query(statement);
                successCount++;
                console.log(`✅ Success: ${statement.substring(0, 50)}...`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Error: ${statement.substring(0, 50)}...`);
                console.error(`   Error details: ${error.message}`);
            }
        }
        
        console.log(`\n📊 ${dbName} Database Update Summary:`);
        console.log(`   ✅ Successful statements: ${successCount}`);
        console.log(`   ❌ Failed statements: ${errorCount}`);
        
        if (errorCount === 0) {
            console.log(`🎉 ${dbName} database updated successfully!`);
        } else {
            console.log(`⚠️  ${dbName} database partially updated. Check errors above.`);
        }
        
    } catch (error) {
        console.error(`💥 Critical error updating ${dbName} database:`, error.message);
        throw error;
    } finally {
        client.release();
    }
}

async function verifyUpdates(pool, dbName) {
    console.log(`\n🔍 Verifying ${dbName} database updates...`);
    
    const client = await pool.connect();
    try {
        // Check if new columns exist
        const coursesResult = await client.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'courses' AND column_name = 'minimum_kcse_grade'
        `);
        
        const studentsResult = await client.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'students' AND column_name = 'kcse_grade'
        `);
        
        console.log(`📋 ${dbName} Database Schema Verification:`);
        console.log(`   📚 Courses table - minimum_kcse_grade column: ${coursesResult.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`   👥 Students table - kcse_grade column: ${studentsResult.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING'}`);
        
        // Show sample data if columns exist
        if (coursesResult.rows.length > 0) {
            const sampleCourses = await client.query(`
                SELECT course_code, name, minimum_kcse_grade 
                FROM courses 
                WHERE minimum_kcse_grade IS NOT NULL 
                LIMIT 5
            `);
            console.log(`\n📚 Sample courses with KCSE grade requirements:`);
            sampleCourses.rows.forEach(course => {
                console.log(`   ${course.course_code}: ${course.name} - Min Grade: ${course.minimum_kcse_grade}`);
            });
        }
        
        if (studentsResult.rows.length > 0) {
            const sampleStudents = await client.query(`
                SELECT admission_number, full_name, kcse_grade 
                FROM students 
                WHERE kcse_grade IS NOT NULL 
                LIMIT 5
            `);
            console.log(`\n👥 Sample students with KCSE grades:`);
            sampleStudents.rows.forEach(student => {
                console.log(`   ${student.admission_number}: ${student.full_name} - Grade: ${student.kcse_grade}`);
            });
        }
        
    } catch (error) {
        console.error(`💥 Error verifying ${dbName} database:`, error.message);
    } finally {
        client.release();
    }
}

async function main() {
    console.log('🚀 Starting KCSE Grade Fields Update Process');
    console.log('=====================================');
    
    try {
        // Update West Campus database
        await executeSqlFile(westPool, 'West Campus');
        await verifyUpdates(westPool, 'West Campus');
        
        console.log('\n=====================================');
        
        // Update Twon Campus database  
        await executeSqlFile(twonPool, 'Twon Campus');
        await verifyUpdates(twonPool, 'Twon Campus');
        
        console.log('\n=====================================');
        console.log('🎉 KCSE Grade Fields Update Process Completed Successfully!');
        console.log('📚 Both West and Twon campus databases have been updated.');
        console.log('👥 Courses now have minimum_kcse_grade requirements.');
        console.log('📝 Students table now has kcse_grade field for recording.');
        
    } catch (error) {
        console.error('💥 Update process failed:', error.message);
        process.exit(1);
    } finally {
        // Close database pools
        await westPool.end();
        await twonPool.end();
        console.log('\n🔐 Database connections closed.');
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the update process
if (require.main === module) {
    main();
}

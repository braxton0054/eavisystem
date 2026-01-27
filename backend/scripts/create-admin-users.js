const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connections
const twonPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_j8sw4iKqRWgu@ep-snowy-math-ahqrtk3r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

const westPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_qoQV16dcCxmp@ep-royal-dew-ahi5hxv4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function createAdminUsers() {
  console.log('🔧 Creating Admin Users...\n');

  try {
    // Create West Campus Admin
    console.log('🏫 Creating West Campus Admin...');
    const westClient = await westPool.connect();
    
    // Hash the password
    const westPassword = '0748022044W*';
    const westHashedPassword = await bcrypt.hash(westPassword, 10);
    
    // Insert or update West admin
    await westClient.query(`
      INSERT INTO admins (username, email, password, campus_name, role, is_active)
      VALUES ('west_admin', 'west@edu', $1, 'west', 'admin', true)
      ON CONFLICT (username) 
      DO UPDATE SET 
        password = $1,
        email = 'west@edu',
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
    `, [westHashedPassword]);
    
    console.log('✅ West Campus Admin Created:');
    console.log('   Username: west_admin');
    console.log('   Password: 0748022044W*');
    console.log('   Campus: west');
    
    westClient.release();

    // Create Twon Campus Admin
    console.log('\n🏫 Creating Twon Campus Admin...');
    const twonClient = await twonPool.connect();
    
    // Hash the password
    const twonPassword = '0726044022T*';
    const twonHashedPassword = await bcrypt.hash(twonPassword, 10);
    
    // Insert or update Twon admin
    await twonClient.query(`
      INSERT INTO admins (username, email, password, campus_name, role, is_active)
      VALUES ('twon_admin', 'twon@edu', $1, 'twon', 'admin', true)
      ON CONFLICT (username) 
      DO UPDATE SET 
        password = $1,
        email = 'twon@edu',
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
    `, [twonHashedPassword]);
    
    console.log('✅ Twon Campus Admin Created:');
    console.log('   Username: twon_admin');
    console.log('   Password: 0726044022T*');
    console.log('   Campus: twon');
    
    twonClient.release();

    console.log('\n🎉 Admin Users Created Successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('West Campus: Username: west_admin | Password: 0748022044W*');
    console.log('Twon Campus: Username: twon_admin | Password: 0726044022T*');
    console.log('\n📝 Note: Email is stored in database but not shown in frontend');
    console.log('   Admins will only need to enter password to login');

  } catch (error) {
    console.error('❌ Error creating admin users:', error);
  } finally {
    await twonPool.end();
    await westPool.end();
  }
}

createAdminUsers();

const { Pool } = require('pg');

const twonConfig = 'postgresql://neondb_owner:npg_j8sw4iKqRWgu@ep-snowy-math-ahqrtk3r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const westConfig = 'postgresql://neondb_owner:npg_qoQV16dcCxmp@ep-royal-dew-ahi5hxv4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const syncSql = `
-- Fix courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS minimum_kcse_grade VARCHAR(10) DEFAULT 'C-';

-- Fix students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS kcse_grade VARCHAR(10);
ALTER TABLE students ALTER COLUMN email DROP NOT NULL;

-- Update Campus Settings for dynamic year detection
UPDATE campus_settings SET admission_number_format = REPLACE(admission_number_format, '2025', '{year}') 
WHERE admission_number_format LIKE '%2025%';

-- Ensure function logic handles {year}
CREATE OR REPLACE FUNCTION generate_admission_number(p_campus_name VARCHAR(50))
RETURNS VARCHAR(50) AS $$
DECLARE
    v_format VARCHAR(50);
    v_sequence_number INTEGER;
    v_admission_number VARCHAR(50);
BEGIN
    SELECT admission_number_format, current_sequence_number 
    INTO v_format, v_sequence_number
    FROM campus_settings 
    WHERE campus_name = p_campus_name;
    
    IF v_format IS NULL THEN
        v_format := UPPER(p_campus_name) || '-{year}-{seq}';
        v_sequence_number := 1001;
        INSERT INTO campus_settings (campus_name, admission_number_format, current_sequence_number)
        VALUES (p_campus_name, v_format, v_sequence_number);
    END IF;
    
    v_admission_number := REPLACE(
        REPLACE(v_format, '{seq}', v_sequence_number::TEXT),
        '{year}', 
        TO_CHAR(CURRENT_DATE, 'YYYY')
    );
    
    UPDATE campus_settings 
    SET current_sequence_number = current_sequence_number + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE campus_name = p_campus_name;
    
    RETURN v_admission_number;
END;
$$ LANGUAGE plpgsql;
`;

async function finalSync() {
    const campuses = [
        { name: 'twon', config: twonConfig },
        { name: 'west', config: westConfig }
    ];

    for (const campus of campuses) {
        console.log(`Finalizing sync for ${campus.name}...`);
        const pool = new Pool({ connectionString: campus.config });
        const client = await pool.connect();
        try {
            await client.query(syncSql);
            console.log(`✅ ${campus.name} database fully synchronized.`);
        } catch (error) {
            console.error(`❌ Sync error on ${campus.name}:`, error.message);
        } finally {
            client.release();
            await pool.end();
        }
    }
}

finalSync().catch(console.error);

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'follow_ups'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== follow_ups table schema ===');
    console.table(result.rows);
    
    // Test the exact query from the route
    const testQuery = await pool.query(`
      SELECT 
        f.*,
        u.full_name as contacted_by_name
       FROM follow_ups f
       LEFT JOIN users u ON f.contacted_by_id = u.id
       WHERE f.company_id = $1
       ORDER BY f.follow_up_date DESC, f.created_at DESC
    `, ['715610c7-7c38-4e3c-b039-9e947edc6740']);
    
    console.log('\n=== Query result ===');
    console.log('Rows:', testQuery.rows);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkSchema();

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

async function checkData() {
  try {
    const companies = await pool.query('SELECT COUNT(*) FROM companies');
    const tasks = await pool.query('SELECT COUNT(*) FROM tasks');
    const tickets = await pool.query('SELECT COUNT(*) FROM tickets');
    const contacts = await pool.query('SELECT COUNT(*) FROM contacts');
    const users = await pool.query('SELECT COUNT(*) FROM users');
    
    // Check if follow_ups table exists
    const followUpsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'follow_ups'
      );
    `);
    
    let followUpsCount = { rows: [{ count: 'N/A' }] };
    if (followUpsTableCheck.rows[0].exists) {
      followUpsCount = await pool.query('SELECT COUNT(*) FROM follow_ups');
    }
    
    console.log('\n=== Database Data Check ===');
    console.log('Companies:', companies.rows[0].count);
    console.log('Tasks:', tasks.rows[0].count);
    console.log('Tickets:', tickets.rows[0].count);
    console.log('Contacts:', contacts.rows[0].count);
    console.log('Users:', users.rows[0].count);
    console.log('Follow-ups table exists:', followUpsTableCheck.rows[0].exists);
    console.log('Follow-ups:', followUpsCount.rows[0].count);
    console.log('===========================\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkData();

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const sql = fs.readFileSync('./database/migrations/007_add_follow_ups.sql', 'utf8');
    
    console.log('Executing migration...');
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();

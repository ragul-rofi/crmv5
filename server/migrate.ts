import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create connection string from individual environment variables if DATABASE_URL is not provided
const getConnectionString = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  return `postgresql://${process.env.VITE_DB_USER}:${process.env.VITE_DB_PASSWORD}@${process.env.VITE_DB_HOST}:${process.env.VITE_DB_PORT}/${process.env.VITE_DB_NAME}`;
};

const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface Migration {
  id: number;
  name: string;
  executed_at: Date;
}

async function createMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
  console.log('✅ Migrations table ready');
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await pool.query<Migration>(
    'SELECT name FROM migrations ORDER BY id ASC'
  );
  return result.rows.map((row) => row.name);
}

async function executeMigration(name: string, sql: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Execute the migration SQL
    await client.query(sql);
    
    // Record the migration
    await client.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [name]
    );
    
    await client.query('COMMIT');
    console.log(`✅ Executed migration: ${name}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Failed to execute migration: ${name}`, error);
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await createMigrationsTable();
    
    // Get list of executed migrations
    const executedMigrations = await getExecutedMigrations();
    console.log(`📋 Found ${executedMigrations.length} executed migrations`);
    
    // Get migration files from database/migrations directory
    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 Creating migrations directory...');
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();
    
    console.log(`📂 Found ${migrationFiles.length} migration files`);
    
    // Execute pending migrations
    let executedCount = 0;
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        await executeMigration(file, sql);
        executedCount++;
      }
    }
    
    if (executedCount === 0) {
      console.log('✅ All migrations are up to date');
    } else {
      console.log(`✅ Successfully executed ${executedCount} new migration(s)`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };

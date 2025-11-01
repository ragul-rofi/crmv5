import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { safeLog } from './utils/logger.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create connection string from individual environment variables
const getConnectionString = () => {
  return `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
};

const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA
  } : {
    rejectUnauthorized: false
  },
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
  safeLog.info('✅ Migrations table ready');
}

async function getExecutedMigrations(): Promise<string[]> {
  try {
    const result = await pool.query<Migration>(
      'SELECT name FROM migrations ORDER BY id ASC'
    );
    return result.rows.map((row) => row.name);
  } catch (error) {
    // If the migrations table doesn't exist yet, return empty array
    if (error.code === '42P01') { // undefined_table error code
      return [];
    }
    throw error;
  }
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
    safeLog.info('✅ Executed migration successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    safeLog.error('❌ Failed to execute migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    safeLog.info('🚀 Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await createMigrationsTable();
    
    // Get list of executed migrations
    const executedMigrations = await getExecutedMigrations();
    safeLog.info(`📋 Found ${executedMigrations.length} executed migrations`);
    
    // Get migration files from database/migrations directory (secure path)
    const migrationsDir = path.resolve(__dirname, '..', 'database', 'migrations');
    
    // Validate the migrations directory is within expected bounds
    const expectedBasePath = path.resolve(__dirname, '..');
    if (!migrationsDir.startsWith(expectedBasePath)) {
      throw new Error('Invalid migrations directory path');
    }
    
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      safeLog.info('📁 Creating migrations directory...');
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();
    
    safeLog.info(`📂 Found ${migrationFiles.length} migration files`);
    
    // Execute pending migrations
    let executedCount = 0;
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        // Validate file name to prevent path traversal
        if (!/^[a-zA-Z0-9_.-]+\.sql$/.test(file)) {
          throw new Error(`Invalid migration file name: ${file}`);
        }
        
        const filePath = path.resolve(migrationsDir, file);
        
        // Ensure the resolved path is still within the migrations directory
        if (!filePath.startsWith(migrationsDir)) {
          throw new Error(`Path traversal attempt detected: ${file}`);
        }
        
        const sql = fs.readFileSync(filePath, 'utf-8');
        await executeMigration(file, sql);
        executedCount++;
      }
    }
    
    if (executedCount === 0) {
      safeLog.info('✅ All migrations are up to date');
    } else {
      safeLog.info(`✅ Successfully executed ${executedCount} new migration(s)`);
    }
    
  } catch (error) {
    safeLog.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      safeLog.info('✅ Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      safeLog.error('❌ Migrations failed:', error);
      process.exit(1);
    });
}

export { runMigrations };
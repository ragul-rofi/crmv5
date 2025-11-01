import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { query } from '../server/db.ts';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of executed migrations
    const executedResult = await query('SELECT filename FROM migrations');
    const executedMigrations = new Set(executedResult.rows.map(row => row.filename));
    
    // Read migration files
    const migrationsDir = join(__dirname, '..', 'database', 'migrations');
    const files = await readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    for (const file of migrationFiles) {
      if (executedMigrations.has(file)) {
        console.log(`Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`Executing ${file}...`);
      
      const filePath = join(migrationsDir, file);
      const sql = await readFile(filePath, 'utf8');
      
      // Execute migration
      await query(sql);
      
      // Record migration as executed
      await query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
      
      console.log(`✓ ${file} executed successfully`);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
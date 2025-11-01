import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { safeLog } from './utils/logger.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug output to check if environment variables are loaded correctly
console.log('DB_USER:', process.env.DB_USER || 'undefined');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
console.log('DB_HOST:', process.env.DB_HOST || 'undefined');
console.log('DB_PORT:', process.env.DB_PORT || '5432');
console.log('DB_NAME:', process.env.DB_NAME || 'undefined');

// Use individual database connection parameters
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA
  } : {
    rejectUnauthorized: false
  },
  // Optimize connection pool for Render database
  max: 5, // Reduced maximum number of clients in the pool
  min: 1,  // Reduced minimum number of clients in the pool
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  keepAlive: true, // Keep TCP connection alive
  keepAliveInitialDelayMillis: 5000, // 5 seconds delay before keepalive
  // Add query timeout
  query_timeout: 30000, // 30 seconds query timeout
});

pool.on('error', (err) => {
  safeLog.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Add connection monitoring
pool.on('connect', (client) => {
  safeLog.info('New database connection established');
});

pool.on('acquire', (client) => {
  safeLog.info('Connection acquired from pool');
});

pool.on('remove', (client) => {
  safeLog.info('Connection removed from pool');
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const startTime = Date.now();
  const client: PoolClient = await pool.connect();
  try {
    const result = await client.query(text, params);
    const duration = Date.now() - startTime;
    
    // Log slow queries (over 1 second)
    if (duration > 1000) {
      safeLog.warn(`Slow query detected: ${duration}ms`);
    }
    
    return result;
  } catch (err) {
    safeLog.error(`Database query error (${Date.now() - startTime}ms):`, err);
    throw err;
  } finally {
    client.release();
  }
};

export default pool;
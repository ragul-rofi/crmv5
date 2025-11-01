import { Pool } from 'pg';
import { config } from './environment.js';

// Optimized connection pool for production
export const createDatabasePool = () => {
  return new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl,
    
    // Production optimizations
    max: process.env.NODE_ENV === 'production' ? 20 : 5,
    min: process.env.NODE_ENV === 'production' ? 5 : 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
    
    // Query timeout
    query_timeout: 30000,
    
    // Statement timeout for long-running queries
    statement_timeout: 60000,
  });
};
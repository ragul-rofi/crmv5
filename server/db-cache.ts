import { QueryResult } from 'pg';
import { query as pgQuery } from './db.js';
import { safeLog } from './utils/logger.js';

// Default TTL for database query results (in seconds)
const DEFAULT_QUERY_TTL = 3600; // 1 hour

/**
 * Generate a cache key for a database query
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns A unique cache key
 */
const generateCacheKey = (text: string, params?: any[]): string => {
  // Create a deterministic string representation of the query and its parameters
  const paramsStr = params ? JSON.stringify(params) : '';
  return `db:query:${Buffer.from(text + paramsStr).toString('base64')}`;
};

/**
 * Execute a database query with caching
 * @param text - SQL query text
 * @param params - Query parameters
 * @param options - Cache options
 * @returns Query result
 */
export const cachedQuery = async (
  text: string,
  params?: any[],
  options?: {
    ttl?: number; // Cache TTL in seconds
    bypassCache?: boolean; // Skip cache lookup
    cachePrefix?: string; // Custom cache key prefix
  }
): Promise<QueryResult> => {
  // Redis removed: directly execute DB query
  return pgQuery(text, params);
};

/**
 * Invalidate cache for a specific entity type
 * @param entityType - Type of entity (e.g., 'companies', 'tasks')
 * @param entityId - Optional specific entity ID
 */
export const invalidateCache = async (_entityType: string, _entityId?: number | string): Promise<void> => {
  // No-op since Redis is removed
  return;
};

// Export the original query function as well
export { pgQuery as query };
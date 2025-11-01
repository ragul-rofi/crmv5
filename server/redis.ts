import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { safeLog } from './utils/logger.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug output to check if Redis environment variables are loaded correctly
console.log('REDIS_HOST:', process.env.REDIS_HOST || 'localhost');
console.log('REDIS_PORT:', process.env.REDIS_PORT || '6379');

// Default TTL for cache entries (in seconds)
const DEFAULT_TTL = parseInt(process.env.REDIS_TTL || '3600');

// Flag to track if Redis is available
let redisAvailable = false;

// Create Redis client with improved configuration
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    // Exponential backoff with max 30 seconds
    const delay = Math.min(times * 50, 30000);
    safeLog.info(`Redis retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  connectTimeout: 10000, // 10 seconds timeout for connection
  lazyConnect: true, // Don't connect immediately
  enableOfflineQueue: false, // Don't queue commands when offline
  enableReadyCheck: true, // Wait for ready state
});

// Event listeners for Redis client
redisClient.on('connect', () => {
  safeLog.info('Redis client connected');
  redisAvailable = true;
});

redisClient.on('error', (err: any) => {
  safeLog.error('Redis client error:', err);
  redisAvailable = false;
});

redisClient.on('reconnecting', () => {
  safeLog.info('Redis client reconnecting');
});

redisClient.on('end', () => {
  safeLog.info('Redis client disconnected');
  redisAvailable = false;
});

redisClient.on('ready', () => {
  safeLog.info('Redis client ready');
  redisAvailable = true;
});

// Test connection on startup
redisClient.connect().catch((err: any) => {
  safeLog.error('Failed to connect to Redis on startup:', err);
  redisAvailable = false;
});

/**
 * Set a value in the cache with expiration
 * @param key - The cache key
 * @param value - The value to cache (will be JSON stringified)
 * @param ttl - Time to live in seconds (optional, defaults to DEFAULT_TTL)
 */
export const setCache = async (key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> => {
  if (!redisAvailable) {
    safeLog.info('Redis not available, skipping cache set');
    return;
  }
  
  try {
    const stringifiedValue = JSON.stringify(value);
    await redisClient.set(key, stringifiedValue, 'EX', ttl);
    safeLog.info('SET Cache: Key set successfully');
  } catch (error) {
    safeLog.error('Error setting cache:', error);
    // Continue execution even if cache fails
  }
};

/**
 * Get a value from the cache
 * @param key - The cache key
 * @returns The cached value or null if not found
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  if (!redisAvailable) {
    safeLog.info('Redis not available, skipping cache get');
    return null;
  }
  
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      safeLog.info('GET Cache: Data found');
      try {
        const parsedData = JSON.parse(cachedData) as T;
        return parsedData;
      } catch (parseError) {
        safeLog.error('Error parsing cached data:', parseError);
        return null;
      }
    }
    safeLog.info('GET Cache: No data found in cache');
    return null;
  } catch (error) {
    safeLog.error('Error getting cache:', error);
    return null;
  }
};

/**
 * Delete a value from the cache
 * @param key - The cache key
 */
export const deleteCache = async (key: string): Promise<void> => {
  if (!redisAvailable) {
    safeLog.info('Redis not available, skipping cache delete');
    return;
  }
  
  try {
    await redisClient.del(key);
    safeLog.info('Deleted cache key successfully');
  } catch (error) {
    safeLog.error('Error deleting cache:', error);
  }
};

/**
 * Delete multiple values from the cache using a pattern
 * @param pattern - The pattern to match keys (e.g., 'companies:*')
 */
export const deleteCacheByPattern = async (pattern: string): Promise<void> => {
  if (!redisAvailable) {
    safeLog.info('Redis not available, skipping cache delete by pattern');
    return;
  }
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      safeLog.info(`Deleted ${keys.length} keys matching pattern`);
    } else {
      safeLog.info('No keys found matching pattern');
    }
  } catch (error) {
    safeLog.error('Error deleting cache by pattern:', error);
  }
};

/**
 * Check if Redis is connected and healthy
 * @returns Boolean indicating if Redis is connected
 */
export const isRedisHealthy = async (): Promise<boolean> => {
  if (!redisAvailable) {
    safeLog.info('Redis not available in health check');
    return false;
  }
  
  try {
    const pong = await redisClient.ping();
    const healthy = pong === 'PONG';
    safeLog.info(`Redis health check: ${healthy ? 'Healthy' : 'Unhealthy'}`);
    return healthy;
  } catch (error) {
    safeLog.error('Redis health check failed:', error);
    return false;
  }
};

/**
 * Get Redis availability status
 * @returns True if Redis is available
 */
export const getRedisAvailability = (): boolean => {
  return redisAvailable;
};

export default redisClient;
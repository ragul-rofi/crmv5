import { Router } from 'express';
import { query } from '../db.js';
// Redis removed
import { safeLog } from '../utils/logger.js';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
}

router.get('/', async (req, res) => {
  const startTime = Date.now();
  let dbHealthy = false;
  let redisHealthy = false;

  try {
    // Check database
    await query('SELECT 1');
    dbHealthy = true;
  } catch (error) {
    safeLog.error('Database health check failed:', error);
  }

  // Redis is not used; mark as disconnected
  redisHealthy = false;

  const memUsage = process.memoryUsage();
  const healthStatus: HealthStatus = {
    status: dbHealthy && redisHealthy ? 'healthy' : 
            dbHealthy ? 'degraded' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected'
    },
    uptime: process.uptime(),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024)
    }
  };

  const responseTime = Date.now() - startTime;
  res.set('X-Response-Time', `${responseTime}ms`);
  
  const statusCode = healthStatus.status === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json(healthStatus);
});

export default router;
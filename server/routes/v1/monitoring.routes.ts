import { Router } from 'express';
import { query } from '../../db.js';
import { verifyToken } from '../../auth.js';
import { requireAdmin } from '../../middleware/roleMiddleware.js';

const router = Router();

// System metrics
router.get('/metrics', verifyToken, requireAdmin, async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    res.json(metrics);
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Database status
router.get('/database', verifyToken, requireAdmin, async (req, res) => {
  try {
    const start = Date.now();
    const result = await query('SELECT NOW() as timestamp, version() as version');
    const responseTime = Date.now() - start;

    res.json({
      status: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: result.rows[0].timestamp,
      version: result.rows[0].version
    });
  } catch (error) {
    res.status(500).json({
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Recent activity
router.get('/activity', verifyToken, requireAdmin, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    
    const [companies, tasks, tickets, users] = await Promise.all([
      query(`
        SELECT COUNT(*) as count, 'companies' as type
        FROM companies
        WHERE created_at >= NOW() - INTERVAL '${hours} hours'
      `),
      query(`
        SELECT COUNT(*) as count, 'tasks' as type
        FROM tasks
        WHERE created_at >= NOW() - INTERVAL '${hours} hours'
      `),
      query(`
        SELECT COUNT(*) as count, 'tickets' as type
        FROM tickets
        WHERE created_at >= NOW() - INTERVAL '${hours} hours'
      `),
      query(`
        SELECT COUNT(*) as count, 'users' as type
        FROM users
        WHERE created_at >= NOW() - INTERVAL '${hours} hours'
      `)
    ]);

    res.json({
      period: `${hours} hours`,
      activity: [
        { type: 'companies', count: parseInt(companies.rows[0].count) },
        { type: 'tasks', count: parseInt(tasks.rows[0].count) },
        { type: 'tickets', count: parseInt(tickets.rows[0].count) },
        { type: 'users', count: parseInt(users.rows[0].count) }
      ]
    });
  } catch (error) {
    console.error('Activity monitoring error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
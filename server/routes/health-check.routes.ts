import { Router } from 'express';
import { query } from '../db.js';
import { verifyToken, AuthRequest } from '../auth.js';

const router = Router();

// Comprehensive health check
router.get('/full', async (req, res) => {
  try {
    const results = {
      database: 'disconnected',
      tables: [],
      sampleData: {},
      authentication: 'not_tested',
      timestamp: new Date().toISOString()
    };

    // Test database connection
    try {
      await query('SELECT NOW()');
      results.database = 'connected';
    } catch (error) {
      results.database = `error: ${error.message}`;
    }

    // Check tables exist
    try {
      const tablesResult = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      results.tables = tablesResult.rows.map(row => row.table_name);
    } catch (error) {
      results.tables = [`error: ${error.message}`];
    }

    // Get sample data counts
    try {
      const [companies, users, tasks] = await Promise.all([
        query('SELECT COUNT(*) as count FROM companies'),
        query('SELECT COUNT(*) as count FROM users'),
        query('SELECT COUNT(*) as count FROM tasks')
      ]);
      
      results.sampleData = {
        companies: parseInt(companies.rows[0].count),
        users: parseInt(users.rows[0].count),
        tasks: parseInt(tasks.rows[0].count)
      };
    } catch (error) {
      results.sampleData = { error: error.message };
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test authentication
router.get('/auth', verifyToken, async (req: AuthRequest, res) => {
  res.json({
    authenticated: true,
    user: {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role
    },
    timestamp: new Date().toISOString()
  });
});

// Test all API endpoints
router.get('/endpoints', verifyToken, async (req: AuthRequest, res) => {
  const endpoints = {
    companies: '/api/companies',
    users: '/api/users',
    tasks: '/api/tasks',
    tickets: '/api/tickets',
    contacts: '/api/contacts'
  };

  res.json({
    message: 'Available endpoints',
    endpoints,
    user: req.user?.role,
    timestamp: new Date().toISOString()
  });
});

export default router;
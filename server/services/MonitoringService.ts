import { query } from '../db.js';

export class MonitoringService {
  async logError(error: Error, context: any) {
    try {
      await query(
        'INSERT INTO error_logs (message, stack, context, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [error.message, error.stack, JSON.stringify(context)]
      );
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  async logUserActivity(userId: string, action: string, details: any) {
    try {
      await query(
        'INSERT INTO user_activity (user_id, action, details, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [userId, action, JSON.stringify(details)]
      );
    } catch (error) {
      console.error('Failed to log user activity:', error);
    }
  }

  async getSystemHealth() {
    try {
      const [dbHealth, errorCount, activeUsers] = await Promise.all([
        query('SELECT NOW() as timestamp'),
        query('SELECT COUNT(*) as count FROM error_logs WHERE created_at > NOW() - INTERVAL \'1 hour\''),
        query('SELECT COUNT(DISTINCT user_id) as count FROM user_activity WHERE created_at > NOW() - INTERVAL \'1 hour\'')
      ]);

      return {
        database: { status: 'healthy', responseTime: Date.now() },
        errors: { lastHour: parseInt(errorCount.rows[0].count) },
        users: { activeLastHour: parseInt(activeUsers.rows[0].count) },
        timestamp: dbHealth.rows[0].timestamp
      };
    } catch (error) {
      return {
        database: { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      };
    }
  }

  async getPerformanceMetrics() {
    return {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };
  }

  async getUserAnalytics(days: number = 30) {
    const result = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_actions
      FROM user_activity 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return result.rows;
  }

  async getErrorAnalytics(hours: number = 24) {
    const result = await query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as error_count,
        COUNT(DISTINCT message) as unique_errors
      FROM error_logs 
      WHERE created_at >= NOW() - INTERVAL '${hours} hours'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour DESC
    `);

    return result.rows;
  }
}
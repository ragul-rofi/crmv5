import { query } from '../db.js';

export class AnalyticsService {
  async getDashboardStats() {
    const [companies, tasks, tickets, users] = await Promise.all([
      query('SELECT COUNT(*) as count FROM companies'),
      query('SELECT COUNT(*) as count FROM tasks'),
      query('SELECT COUNT(*) as count FROM tickets'),
      query('SELECT COUNT(*) as count FROM users')
    ]);

    return {
      companies: parseInt(companies.rows[0].count),
      tasks: parseInt(tasks.rows[0].count),
      tickets: parseInt(tickets.rows[0].count),
      users: parseInt(users.rows[0].count)
    };
  }

  async getCompanyStats() {
    const statusStats = await query(`
      SELECT status, COUNT(*) as count
      FROM companies
      WHERE status IS NOT NULL
      GROUP BY status
    `);

    const conversionStats = await query(`
      SELECT conversion_status, COUNT(*) as count
      FROM companies
      WHERE conversion_status IS NOT NULL
      GROUP BY conversion_status
    `);

    return {
      byStatus: statusStats.rows,
      byConversion: conversionStats.rows
    };
  }

  async getTaskStats() {
    const statusStats = await query(`
      SELECT status, COUNT(*) as count
      FROM tasks
      GROUP BY status
    `);

    const userStats = await query(`
      SELECT u.full_name, COUNT(t.id) as task_count
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to_id
      GROUP BY u.id, u.full_name
      ORDER BY task_count DESC
      LIMIT 10
    `);

    return {
      byStatus: statusStats.rows,
      byUser: userStats.rows
    };
  }

  async getTicketStats() {
    const statusStats = await query(`
      SELECT 
        CASE WHEN is_resolved THEN 'Resolved' ELSE 'Open' END as status,
        COUNT(*) as count
      FROM tickets
      GROUP BY is_resolved
    `);

    const userStats = await query(`
      SELECT u.full_name, COUNT(t.id) as ticket_count
      FROM users u
      LEFT JOIN tickets t ON u.id = t.assigned_to_id
      GROUP BY u.id, u.full_name
      ORDER BY ticket_count DESC
      LIMIT 10
    `);

    return {
      byStatus: statusStats.rows,
      byUser: userStats.rows
    };
  }

  async getActivityStats(days = 30) {
    const activity = await query(`
      SELECT 
        DATE(created_at) as date,
        'company' as type,
        COUNT(*) as count
      FROM companies
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      
      UNION ALL
      
      SELECT 
        DATE(created_at) as date,
        'task' as type,
        COUNT(*) as count
      FROM tasks
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      
      ORDER BY date DESC
    `);

    return activity.rows;
  }
}
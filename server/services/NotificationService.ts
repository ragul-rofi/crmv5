import { query } from '../db.js';

export class NotificationService {
  async getByUser(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const notifications = await query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    const total = await query('SELECT COUNT(*) as total FROM notifications WHERE user_id = $1', [userId]);
    
    return {
      data: notifications.rows,
      pagination: {
        page,
        limit,
        total: parseInt(total.rows[0].total),
        pages: Math.ceil(parseInt(total.rows[0].total) / limit)
      }
    };
  }

  async create(data: any) {
    const { userId, message, type = 'info' } = data;
    const result = await query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3) RETURNING *',
      [userId, message, type]
    );
    return result.rows[0];
  }

  async markAsRead(id: string, userId: string) {
    const result = await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }

  async markAllAsRead(userId: string) {
    const result = await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );
    return result.rowCount;
  }

  async getUnreadCount(userId: string) {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  async delete(id: string, userId: string) {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }
}
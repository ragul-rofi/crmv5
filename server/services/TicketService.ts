import { query } from '../db.js';

export class TicketService {
  async getAll(page = 1, limit = 50, companyId?: string) {
    const offset = (page - 1) * limit;
    
    let ticketsQuery: string;
    let totalQuery: string;
    let queryParams: any[];
    let totalParams: any[];
    
    if (companyId) {
      // Filter by company_id if provided
      ticketsQuery = `
        SELECT t.*, c.name as company_name, 
               u1.full_name as raised_by_name,
               u2.full_name as assigned_to_name
        FROM tickets t
        LEFT JOIN companies c ON t.company_id = c.id
        LEFT JOIN users u1 ON t.raised_by_id = u1.id
        LEFT JOIN users u2 ON t.assigned_to_id = u2.id
        WHERE t.company_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      queryParams = [companyId, limit, offset];
      
      totalQuery = 'SELECT COUNT(*) as total FROM tickets WHERE company_id = $1';
      totalParams = [companyId];
    } else {
      // Get all tickets if no companyId filter
      ticketsQuery = `
        SELECT t.*, c.name as company_name, 
               u1.full_name as raised_by_name,
               u2.full_name as assigned_to_name
        FROM tickets t
        LEFT JOIN companies c ON t.company_id = c.id
        LEFT JOIN users u1 ON t.raised_by_id = u1.id
        LEFT JOIN users u2 ON t.assigned_to_id = u2.id
        ORDER BY t.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      queryParams = [limit, offset];
      
      totalQuery = 'SELECT COUNT(*) as total FROM tickets';
      totalParams = [];
    }
    
    const tickets = await query(ticketsQuery, queryParams);
    const total = await query(totalQuery, totalParams);
    
    return {
      data: tickets.rows,
      pagination: {
        page,
        limit,
        total: parseInt(total.rows[0].total),
        pages: Math.ceil(parseInt(total.rows[0].total) / limit)
      }
    };
  }

  async getByUser(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const tickets = await query(`
      SELECT t.*, c.name as company_name, 
             u1.full_name as raised_by_name,
             u2.full_name as assigned_to_name
      FROM tickets t
      LEFT JOIN companies c ON t.company_id = c.id
      LEFT JOIN users u1 ON t.raised_by_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to_id = u2.id
      WHERE t.assigned_to_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    const total = await query('SELECT COUNT(*) as total FROM tickets WHERE assigned_to_id = $1', [userId]);
    
    return {
      data: tickets.rows,
      pagination: {
        page,
        limit,
        total: parseInt(total.rows[0].total),
        pages: Math.ceil(parseInt(total.rows[0].total) / limit)
      }
    };
  }

  async create(data: any, raisedById: string) {
    const { title, description, companyId, assignedToId } = data;
    const result = await query(
      `INSERT INTO tickets (title, description, company_id, raised_by_id, assigned_to_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, companyId, raisedById, assignedToId]
    );
    return result.rows[0];
  }

  async update(id: string, data: any) {
    const { title, description, isResolved, assignedToId } = data;
    const result = await query(
      `UPDATE tickets SET title = $1, description = $2, is_resolved = $3, assigned_to_id = $4,
       resolved_at = CASE WHEN $3 = true THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id = $5 RETURNING *`,
      [title, description, isResolved, assignedToId, id]
    );
    return result.rows[0];
  }

  async delete(id: string) {
    const result = await query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  async getOpenCount(userId: string) {
    const result = await query(
      'SELECT COUNT(*) as count FROM tickets WHERE assigned_to_id = $1 AND is_resolved = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}
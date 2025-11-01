import { query } from '../db.js';
import { PaginationParams } from '../types/common.js';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  deadline?: Date;
  company_id?: string;
  assigned_to_id?: string;
  assigned_by_id?: string;
  created_at: Date;
}

interface TaskFilters {
  assigned_to_id?: string;
}

export class TaskService {
  async findAll(pagination: PaginationParams, filters?: TaskFilters) {
    let queryText = `
      SELECT t.*, c.name as company_name, u.full_name as assigned_to_name, assigner.full_name as assigned_by_name
      FROM tasks t
      LEFT JOIN companies c ON t.company_id = c.id
      LEFT JOIN users u ON t.assigned_to_id = u.id
      LEFT JOIN users assigner ON t.assigned_by_id = assigner.id
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM tasks t';
    const params: any[] = [];
    
    if (filters?.assigned_to_id) {
      queryText += ' WHERE t.assigned_to_id = $1';
      countQuery += ' WHERE t.assigned_to_id = $1';
      params.push(filters.assigned_to_id);
    }
    
    queryText += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pagination.limit, pagination.offset);
    
    const [dataResult, countResult] = await Promise.all([
      query(queryText, params),
      query(countQuery, params.slice(0, -2))
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    
    return {
      data: dataResult.rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit)
      }
    };
  }

  async findMyTasks(userId: string, pagination: PaginationParams) {
    return this.findAll(pagination, { assigned_to_id: userId });
  }

  async getMyOpenTasksCount(userId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM tasks WHERE assigned_to_id = $1 AND status != \'Completed\'',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  async findById(id: string): Promise<Task | null> {
    const result = await query(
      `SELECT t.*, c.name as company_name, u.full_name as assigned_to_name, assigner.full_name as assigned_by_name
       FROM tasks t
       LEFT JOIN companies c ON t.company_id = c.id
       LEFT JOIN users u ON t.assigned_to_id = u.id
       LEFT JOIN users assigner ON t.assigned_by_id = assigner.id
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async createTask(data: any, assignedById: string): Promise<Task> {
    const result = await query(
      `INSERT INTO tasks (title, description, status, deadline, company_id, assigned_to_id, assigned_by_id, target_count, start_date, task_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        data.title, data.description, data.status || 'NotYet', data.deadline,
        data.companyId, data.assignedToId, assignedById,
        data.target_count, data.start_date, data.task_type
      ]
    );
    
    return result.rows[0];
  }

  async updateTask(id: string, data: any): Promise<Task | null> {
    const result = await query(
      `UPDATE tasks SET title = $1, description = $2, status = $3, deadline = $4, company_id = $5, assigned_to_id = $6, target_count = $7, start_date = $8, task_type = $9
       WHERE id = $10 RETURNING *`,
      [
        data.title, data.description, data.status, data.deadline,
        data.companyId, data.assignedToId, data.target_count,
        data.start_date, data.task_type, id
      ]
    );

    return result.rows[0] || null;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }
}
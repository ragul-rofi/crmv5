import { query } from '../db.js';
import { PaginationParams } from '../types/common.js';
import bcrypt from 'bcrypt';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: Date;
}

export class UserService {
  async findAll(pagination: PaginationParams) {
    const [dataResult, countResult] = await Promise.all([
      query(
        'SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pagination.limit, pagination.offset]
      ),
      query('SELECT COUNT(*) as total FROM users', [])
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

  async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async createUser(data: any): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, created_at',
      [data.email, passwordHash, data.full_name, data.role || 'DataCollector']
    );
    
    return result.rows[0];
  }

  async updateUser(id: string, data: any): Promise<User | null> {
    let updateQuery = 'UPDATE users SET email = $1, full_name = $2, role = $3';
    let params = [data.email, data.full_name, data.role];
    
    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      updateQuery += ', password_hash = $4 WHERE id = $5 RETURNING id, email, full_name, role, created_at';
      params.push(passwordHash, id);
    } else {
      updateQuery += ' WHERE id = $4 RETURNING id, email, full_name, role, created_at';
      params.push(id);
    }
    
    const result = await query(updateQuery, params);
    return result.rows[0] || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }

  async getUsersList() {
    const result = await query(
      'SELECT id, full_name, email, role FROM users ORDER BY full_name ASC',
      []
    );
    return result.rows;
  }
}
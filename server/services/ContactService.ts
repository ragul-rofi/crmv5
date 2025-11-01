import { query } from '../db.js';

export class ContactService {
  async getAll(page = 1, limit = 50, companyId?: string) {
    const offset = (page - 1) * limit;
    
    let contactsQuery: string;
    let totalQuery: string;
    let queryParams: any[];
    let totalParams: any[];
    
    if (companyId) {
      // Filter by company_id if provided
      contactsQuery = `
        SELECT c.*, co.name as company_name 
        FROM contacts c
        LEFT JOIN companies co ON c.company_id = co.id
        WHERE c.company_id = $1
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      queryParams = [companyId, limit, offset];
      
      totalQuery = 'SELECT COUNT(*) as total FROM contacts WHERE company_id = $1';
      totalParams = [companyId];
    } else {
      // Get all contacts if no companyId filter
      contactsQuery = `
        SELECT c.*, co.name as company_name 
        FROM contacts c
        LEFT JOIN companies co ON c.company_id = co.id
        ORDER BY c.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      queryParams = [limit, offset];
      
      totalQuery = 'SELECT COUNT(*) as total FROM contacts';
      totalParams = [];
    }
    
    const contacts = await query(contactsQuery, queryParams);
    const total = await query(totalQuery, totalParams);
    
    // Map snake_case to camelCase
    const mappedData = contacts.rows.map(row => ({
      ...row,
      companyId: row.company_id,
      companyName: row.company_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    return {
      data: mappedData,
      pagination: {
        page,
        limit,
        total: parseInt(total.rows[0].total),
        pages: Math.ceil(parseInt(total.rows[0].total) / limit)
      }
    };
  }

  async create(data: any) {
    const { name, email, phone, companyId } = data;
    const result = await query(
      'INSERT INTO contacts (name, email, phone, company_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, companyId]
    );
    const row = result.rows[0];
    return {
      ...row,
      companyId: row.company_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async update(id: string, data: any) {
    const { name, email, phone, companyId } = data;
    const result = await query(
      'UPDATE contacts SET name = $1, email = $2, phone = $3, company_id = $4 WHERE id = $5 RETURNING *',
      [name, email, phone, companyId, id]
    );
    return result.rows[0];
  }

  async delete(id: string) {
    const result = await query('DELETE FROM contacts WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}
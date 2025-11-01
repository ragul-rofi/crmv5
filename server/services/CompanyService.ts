import { query } from '../db.js';
// Disable caching for debugging
const cachedQuery = query;
import { PaginationParams } from '../types/common.js';
import { UserRole } from '../utils/roles.js';

interface Company {
  id: string;
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  conversionStatus: string;
  finalization_status: string;
  created_at: Date;
}

interface CompanyFilters {
  role?: UserRole;
  userId?: string;
  finalized?: boolean;
}

export class CompanyService {
  async findAll(pagination: PaginationParams, filters?: CompanyFilters) {
    let queryText = `
      SELECT c.*, 
             dc.full_name as data_collector_name,
             cv.full_name as converter_name,
             fb.full_name as finalized_by_name
      FROM companies c
      LEFT JOIN users dc ON c.assigned_data_collector_id = dc.id
      LEFT JOIN users cv ON c.assigned_converter_id = cv.id
      LEFT JOIN users fb ON c.finalized_by_id = fb.id
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM companies c';
    const params = [];
    
    // Add filters
    if (filters?.role === 'Converter' && filters.userId) {
      queryText += ' WHERE (c.assigned_converter_id = $1 OR c.is_public = true)';
      countQuery += ' WHERE (c.assigned_converter_id = $1 OR c.is_public = true)';
      params.push(filters.userId);
    }
    
    if (filters?.finalized) {
      const whereClause = params.length > 0 ? ' AND' : ' WHERE';
      queryText += `${whereClause} c.finalization_status = 'Finalized'`;
      countQuery += `${whereClause} c.finalization_status = 'Finalized'`;
    }
    
    queryText += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pagination.limit, pagination.offset);
    
    const [dataResult, countResult] = await Promise.all([
      query(queryText, params),
      query(countQuery, params.slice(0, -2)) // Remove limit/offset for count
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    
    // Map snake_case to camelCase for frontend
    const mappedData = dataResult.rows.map(row => ({
      ...row,
      conversionStatus: row.conversion_status,
      customFields: row.custom_fields && typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields) : row.custom_fields,
      assignedDataCollectorId: row.assigned_data_collector_id,
      assignedConverterId: row.assigned_converter_id,
      finalizationStatus: row.finalization_status,
      finalizedById: row.finalized_by_id,
      finalizedAt: row.finalized_at,
      employeeCount: row.employee_count,
      annualRevenue: row.annual_revenue,
      contactPerson: row.contact_person,
      companyType: row.company_type,
      isPublic: row.is_public,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return {
      data: mappedData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit)
      }
    };
  }

  async findMyCompanies(userId: string, pagination: PaginationParams) {
    return this.findAll(pagination, { userId, role: 'Converter' });
  }

  async findFinalizedCompanies(pagination: PaginationParams) {
    return this.findAll(pagination, { finalized: true });
  }

  async findById(id: string): Promise<Company | null> {
    const result = await query(
      `SELECT c.*, 
             dc.full_name as data_collector_name,
             cv.full_name as converter_name,
             fb.full_name as finalized_by_name
      FROM companies c
      LEFT JOIN users dc ON c.assigned_data_collector_id = dc.id
      LEFT JOIN users cv ON c.assigned_converter_id = cv.id
      LEFT JOIN users fb ON c.finalized_by_id = fb.id
      WHERE c.id = $1`,
      [id]
    );
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      ...row,
      conversionStatus: row.conversion_status,
      customFields: row.custom_fields && typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields) : row.custom_fields,
      assignedDataCollectorId: row.assigned_data_collector_id,
      assignedConverterId: row.assigned_converter_id,
      finalizationStatus: row.finalization_status,
      finalizedById: row.finalized_by_id,
      finalizedAt: row.finalized_at,
      employeeCount: row.employee_count,
      annualRevenue: row.annual_revenue,
      contactPerson: row.contact_person,
      companyType: row.company_type,
      isPublic: row.is_public,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async createCompany(data: any, userId: string): Promise<Company> {
    const result = await query(
      `INSERT INTO companies (name, website, phone, email, address, conversion_status, custom_fields, assigned_data_collector_id, assigned_converter_id, industry, company_type, employee_count, annual_revenue, notes, contact_person, rating, is_public, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [
        data.name, data.website, data.phone, data.email, data.address,
        data.conversionStatus || 'Waiting',
        data.customFields ? JSON.stringify(data.customFields) : null,
        data.assigned_data_collector_id || userId,
        data.assigned_converter_id || null,
        data.industry || null, data.company_type || null,
        data.employee_count || null, data.annual_revenue || null,
        data.notes || null, data.contact_person || null,
        data.rating || null,
        typeof data.is_public === 'boolean' ? data.is_public : true,
        data.status || null
      ]
    );

    return result.rows[0];
  }

  async updateCompany(id: string, data: any): Promise<Company | null> {
    const result = await query(
      `UPDATE companies SET name = $1, website = $2, phone = $3, email = $4, address = $5, conversion_status = $6, custom_fields = $7, assigned_data_collector_id = $8, assigned_converter_id = $9, industry = $10, company_type = $11, employee_count = $12, annual_revenue = $13, notes = $14, contact_person = $15, rating = $16, is_public = $17, status = $18, updated_at = CURRENT_TIMESTAMP WHERE id = $19 RETURNING *`,
      [
        data.name, data.website, data.phone, data.email, data.address,
        data.conversionStatus,
        data.customFields ? JSON.stringify(data.customFields) : null,
        data.assigned_data_collector_id, data.assigned_converter_id,
        data.industry || null, data.company_type || null,
        data.employee_count, data.annual_revenue, data.notes,
        data.contact_person, data.rating,
        typeof data.is_public === 'boolean' ? data.is_public : true,
        data.status || null, id
      ]
    );

    return result.rows[0] || null;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await query('DELETE FROM companies WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }

  async finalizeCompany(id: string, userId: string): Promise<Company | null> {
    // Use a transaction to ensure data consistency
    // First check the current state
    const checkResult = await query(
      `SELECT id, finalization_status, conversion_status 
       FROM companies 
       WHERE id = $1`,
      [id]
    );

    if (!checkResult.rows[0]) {
      throw new Error('Company not found');
    }

    const company = checkResult.rows[0];

    // Validate business rules
    if (company.finalization_status === 'Finalized') {
      throw new Error('Company is already finalized');
    }

    if (company.conversion_status !== 'Confirmed') {
      throw new Error('Can only finalize companies with Confirmed conversion status');
    }

    // Perform the finalization
    const result = await query(
      `UPDATE companies 
       SET finalization_status = 'Finalized', 
           finalized_by_id = $1, 
           finalized_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [userId, id]
    );

    return result.rows[0] || null;
  }

  async unfinalizeCompany(id: string, userId: string): Promise<Company | null> {
    // Check current state
    const checkResult = await query(
      `SELECT id, finalization_status 
       FROM companies 
       WHERE id = $1`,
      [id]
    );

    if (!checkResult.rows[0]) {
      throw new Error('Company not found');
    }

    const company = checkResult.rows[0];

    if (company.finalization_status !== 'Finalized') {
      throw new Error('Company is not finalized');
    }

    const result = await query(
      `UPDATE companies 
       SET finalization_status = NULL, 
           finalized_by_id = NULL, 
           finalized_at = NULL 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    return result.rows[0] || null;
  }

  async getApprovalQueue(role: UserRole, userId: string, pagination: PaginationParams) {
    let stageFilter = '';
    const params: any[] = [];

    // Use existing finalization_status column instead of non-existent approval_stage
    if (role === 'Converter') {
      stageFilter = `finalization_status = 'Pending' AND (assigned_converter_id = $1 OR is_public = true)`;
      params.push(userId);
    } else if (role === 'Manager') {
      stageFilter = `finalization_status = 'Pending'`;
    } else if (role === 'Head' || role === 'SubHead') {
      stageFilter = `finalization_status = 'Pending'`;
    } else if (role === 'Admin') {
      // Admin can see all pending companies
      stageFilter = `finalization_status = 'Pending'`;
    } else {
      // Other roles have no queue
      return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, pages: 0 } };
    }

    const listQuery = `
      SELECT c.id, c.name, c.email, c.conversion_status, c.created_at, c.assigned_data_collector_id, c.assigned_converter_id
      FROM companies c
      WHERE ${stageFilter}
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const countQuery = `SELECT COUNT(*) AS total FROM companies c WHERE ${stageFilter}`;
    const listParams = [...params, pagination.limit, pagination.offset];

    const [listRes, countRes] = await Promise.all([
      query(listQuery, listParams),
      query(countQuery, params)
    ]);

    const total = parseInt(countRes.rows[0]?.total || '0', 10);
    // Map to frontend shape (camelCase conversionStatus)
    const data = listRes.rows.map((r: any) => ({ 
      id: r.id, 
      name: r.name, 
      email: r.email, 
      conversionStatus: r.conversion_status,
      createdAt: r.created_at,
      assignedDataCollectorId: r.assigned_data_collector_id,
      assignedConverterId: r.assigned_converter_id
    }));

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit)
      }
    };
  }

  async bulkApprove(ids: string[], role: UserRole, userId: string) {
    if (!ids.length) return { updated: 0 };
    
    // Simplified approval: all roles can finalize pending companies
    const updateSQL = `
      UPDATE companies 
      SET finalization_status = 'Finalized',
          finalized_by_id = $1,
          finalized_at = CURRENT_TIMESTAMP
      WHERE id = ANY($2::uuid[]) AND finalization_status = 'Pending'
      RETURNING id, name, assigned_data_collector_id, assigned_converter_id
    `;
    
    const res = await query(updateSQL, [userId, ids]);
    
    // Create notifications for affected users
    if (res.rows.length > 0) {
      for (const company of res.rows) {
        const affectedUsers = [
          company.assigned_data_collector_id,
          company.assigned_converter_id
        ].filter(Boolean);

        // Create notification for each affected user
        for (const affectedUserId of affectedUsers) {
          try {
            await query(
              `INSERT INTO notifications (user_id, message, type, entity_type, entity_id)
               VALUES ($1, $2, 'success', 'company', $3)`,
              [
                affectedUserId,
                `Company "${company.name}" has been approved and finalized`,
                company.id
              ]
            );
          } catch (error) {
            // Log error but don't fail the bulk approve
            console.error(`Failed to create notification for user ${affectedUserId}:`, error);
          }
        }
      }
    }
    
    return { updated: res.rowCount || 0 };
  }

  async bulkReject(ids: string[], role: UserRole) {
    if (!ids.length) return { updated: 0 };

    // Simplified rejection: reset finalization status to Pending
    const res = await query(
      `UPDATE companies 
       SET finalization_status = 'Pending',
           finalized_by_id = NULL,
           finalized_at = NULL
       WHERE id = ANY($1::uuid[])
       RETURNING id, name, assigned_data_collector_id, assigned_converter_id`,
      [ids]
    );
    
    // Create notifications for affected users
    if (res.rows.length > 0) {
      for (const company of res.rows) {
        const affectedUsers = [
          company.assigned_data_collector_id,
          company.assigned_converter_id
        ].filter(Boolean);

        // Create notification for each affected user
        for (const affectedUserId of affectedUsers) {
          try {
            await query(
              `INSERT INTO notifications (user_id, message, type, entity_type, entity_id)
               VALUES ($1, $2, 'warning', 'company', $3)`,
              [
                affectedUserId,
                `Company "${company.name}" approval was rejected`,
                company.id
              ]
            );
          } catch (error) {
            // Log error but don't fail the bulk reject
            console.error(`Failed to create notification for user ${affectedUserId}:`, error);
          }
        }
      }
    }
    
    return { updated: res.rowCount || 0 };
  }

  async bulkCreateCompanies(companies: any[], userId: string) {
    const results: any[] = [];
    const errors: Array<{ row: number; company: string; error: string }> = [];

    for (let i = 0; i < companies.length; i++) {
      try {
        const company = companies[i];
        
        // Validate and sanitize company_type mapping
        let companyType = company.company_type;
        if (companyType === 'YES') {
          companyType = 'Prospect';
        } else if (companyType === 'NO') {
          companyType = 'Customer';
        }
        
        // Ensure conversionStatus is valid
        const validStatuses = ['Waiting', 'NoReach', 'Contacted', 'Negotiating', 'Confirmed'];
        const conversionStatus = validStatuses.includes(company.conversionStatus) 
          ? company.conversionStatus 
          : 'Waiting';

        const result = await query(
          `INSERT INTO companies (
            name, website, phone, email, address, conversion_status, 
            custom_fields, assigned_data_collector_id, assigned_converter_id, 
            industry, company_type, employee_count, annual_revenue, 
            notes, contact_person, rating, is_public, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
          RETURNING id`,
          [
            company.name,
            company.website || null,
            company.phone || null,
            company.email || null,
            company.address || null,
            conversionStatus,
            company.customFields ? JSON.stringify(company.customFields) : null,
            company.assigned_data_collector_id || userId,
            company.assigned_converter_id || null,
            company.industry || null,
            companyType || null,
            company.employee_count || null,
            company.annual_revenue || null,
            company.notes || null,
            company.contact_person || null,
            company.rating || null,
            typeof company.is_public === 'boolean' ? company.is_public : true,
            company.status || null
          ]
        );
        
        results.push(result.rows[0]);
      } catch (error) {
        errors.push({
          row: i + 1,
          company: companies[i]?.name || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      count: results.length,
      errors: errors
    };
  }
}
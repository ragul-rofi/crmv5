import { query } from '../db.js';

export class AdminService {
  // Role permissions management
  async updateRolePermissions(rolePermissions: any) {
    // Store role permissions in database
    const result = await query(
      'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP RETURNING *',
      ['role_permissions', JSON.stringify(rolePermissions)]
    );
    return result.rows[0];
  }

  async getRolePermissions() {
    const result = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      ['role_permissions']
    );
    return result.rows[0]?.value || null;
  }

  // User ticket permissions
  async updateUserTicketPermission(userId: string, canRaiseTickets: boolean) {
    const result = await query(
      'UPDATE users SET can_raise_tickets = $1 WHERE id = $2 RETURNING *',
      [canRaiseTickets, userId]
    );
    return result.rows[0];
  }

  async getUserTicketPermissions() {
    const result = await query(
      'SELECT id, full_name, role, can_raise_tickets FROM users ORDER BY full_name'
    );
    return result.rows;
  }

  // Company visibility management
  async updateCompanyVisibility(companyId: string, isPublic: boolean) {
    const result = await query(
      'UPDATE companies SET is_public = $1 WHERE id = $2 RETURNING *',
      [isPublic, companyId]
    );
    return result.rows[0];
  }

  async bulkUpdateCompanyVisibility(companyIds: string[], isPublic: boolean) {
    const result = await query(
      'UPDATE companies SET is_public = $1 WHERE id = ANY($2) RETURNING *',
      [isPublic, companyIds]
    );
    return result.rows;
  }

  // System settings
  async updateSystemSetting(key: string, value: any) {
    const result = await query(
      'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP RETURNING *',
      [key, JSON.stringify(value)]
    );
    return result.rows[0];
  }

  async getSystemSetting(key: string) {
    const result = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      [key]
    );
    return result.rows[0]?.value || null;
  }

  async getAllSystemSettings() {
    const result = await query('SELECT key, value FROM system_settings');
    const settings: Record<string, any> = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  }
}
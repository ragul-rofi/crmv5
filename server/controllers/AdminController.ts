import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService.js';
import { AuthRequest } from '../auth.js';

const adminService = new AdminService();

export class AdminController {
  // Role permissions
  async updateRolePermissions(req: AuthRequest, res: Response) {
    try {
      const rolePermissions = req.body;
      const result = await adminService.updateRolePermissions(rolePermissions);
      res.json({ message: 'Role permissions updated successfully', data: result });
    } catch (error) {
      console.error('Update role permissions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getRolePermissions(req: Request, res: Response) {
    try {
      const permissions = await adminService.getRolePermissions();
      res.json(permissions);
    } catch (error) {
      console.error('Get role permissions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // User ticket permissions
  async updateUserTicketPermission(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { canRaiseTickets } = req.body;
      
      const result = await adminService.updateUserTicketPermission(userId, canRaiseTickets);
      if (!result) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ message: 'User ticket permission updated successfully', data: result });
    } catch (error) {
      console.error('Update user ticket permission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserTicketPermissions(req: Request, res: Response) {
    try {
      const permissions = await adminService.getUserTicketPermissions();
      res.json(permissions);
    } catch (error) {
      console.error('Get user ticket permissions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Company visibility
  async updateCompanyVisibility(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.params;
      const { isPublic } = req.body;
      
      const result = await adminService.updateCompanyVisibility(companyId, isPublic);
      if (!result) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      res.json({ message: 'Company visibility updated successfully', data: result });
    } catch (error) {
      console.error('Update company visibility error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async bulkUpdateCompanyVisibility(req: AuthRequest, res: Response) {
    try {
      const { companyIds, isPublic } = req.body;
      
      const results = await adminService.bulkUpdateCompanyVisibility(companyIds, isPublic);
      res.json({ 
        message: `${results.length} companies visibility updated successfully`, 
        data: results 
      });
    } catch (error) {
      console.error('Bulk update company visibility error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // System settings
  async updateSystemSetting(req: AuthRequest, res: Response) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      const result = await adminService.updateSystemSetting(key, value);
      res.json({ message: 'System setting updated successfully', data: result });
    } catch (error) {
      console.error('Update system setting error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSystemSetting(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const value = await adminService.getSystemSetting(key);
      res.json({ key, value });
    } catch (error) {
      console.error('Get system setting error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllSystemSettings(req: Request, res: Response) {
    try {
      const settings = await adminService.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error('Get all system settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
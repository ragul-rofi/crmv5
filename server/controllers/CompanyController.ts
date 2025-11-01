import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth.js';
import { CompanyService } from '../services/CompanyService.js';
import { getPaginationParams } from '../utils/pagination.js';
import { sendSuccess, sendError } from '../utils/standardResponse.js';
import { hasPermission, UserRole } from '../utils/roles.js';

export class CompanyController {
  private companyService = new CompanyService();

  getCompanies = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const pagination = getPaginationParams(req.query);
      const role = req.user?.role as UserRole | undefined;
      const userId = req.user?.id;

      const result = await this.companyService.findAll(pagination, { role, userId });
      
      return sendSuccess(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  getMyCompanies = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const role = req.user?.role;
      if (role !== 'Converter') {
        return sendError(res, 'This endpoint is only for Converters', 403);
      }

      const pagination = getPaginationParams(req.query);
      const result = await this.companyService.findMyCompanies(req.user!.id, pagination);
      
      return sendSuccess(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  getFinalizedCompanies = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const role = req.user?.role;
      if (!hasPermission(role as any, 'canReadFinalized')) {
        return sendError(res, 'You do not have permission to view finalized data', 403);
      }

      const pagination = getPaginationParams(req.query);
      const result = await this.companyService.findFinalizedCompanies(pagination);
      
      return sendSuccess(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  getCompany = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const company = await this.companyService.findById(req.params.id);
      if (!company) {
        return sendError(res, 'Company not found', 404);
      }
      
      return sendSuccess(res, company);
    } catch (error) {
      next(error);
    }
  };

  createCompany = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const company = await this.companyService.createCompany(req.body, req.user!.id);
      
      return sendSuccess(res, company, undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  updateCompany = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const company = await this.companyService.updateCompany(req.params.id, req.body);
      if (!company) {
        return sendError(res, 'Company not found', 404);
      }
      
      return sendSuccess(res, company);
    } catch (error) {
      next(error);
    }
  };

  deleteCompany = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const deleted = await this.companyService.deleteCompany(req.params.id);
      if (!deleted) {
        return sendError(res, 'Company not found', 404);
      }
      
      return sendSuccess(res, { message: 'Company deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  finalizeCompany = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const company = await this.companyService.finalizeCompany(req.params.id, req.user!.id);
      if (!company) {
        return sendError(res, 'Company not found', 404);
      }
      
      return sendSuccess(res, { message: 'Company finalized successfully', company });
    } catch (error) {
      next(error);
    }
  };

  unfinalizeCompany = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const company = await this.companyService.unfinalizeCompany(req.params.id, req.user!.id);
      if (!company) {
        return sendError(res, 'Company not found', 404);
      }
      
      return sendSuccess(res, { message: 'Company dropped from finalized status successfully', company });
    } catch (error) {
      next(error);
    }
  };

  getApprovalQueue = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const role = req.user!.role as UserRole;
      const userId = req.user!.id;
      const pagination = getPaginationParams(req.query);
      const result = await this.companyService.getApprovalQueue(role, userId, pagination);
      
      return sendSuccess(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  bulkApprovalAction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { ids, action } = req.body as { ids: string[]; action: 'approve' | 'reject' };
      if (!Array.isArray(ids) || ids.length === 0) {
        return sendError(res, 'ids array is required', 400);
      }
      
      const role = req.user!.role as UserRole;
      
      if (action === 'approve') {
        const result = await this.companyService.bulkApprove(ids, role, req.user!.id);
        return sendSuccess(res, { message: 'Approved successfully', updated: result.updated });
      } else if (action === 'reject') {
        const result = await this.companyService.bulkReject(ids, role);
        return sendSuccess(res, { message: 'Rejected successfully', updated: result.updated });
      } else {
        return sendError(res, 'Invalid action', 400);
      }
    } catch (error) {
      next(error);
    }
  };

  bulkImportCompanies = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { companies } = req.body;
      const userId = req.user!.id;
      
      const result = await this.companyService.bulkCreateCompanies(companies, userId);
      
      if (result.errors.length > 0) {
        return sendSuccess(res, {
          message: `Import completed with ${result.errors.length} errors`,
          imported: result.count,
          failed: result.errors.length,
          errors: result.errors
        }, undefined, 207); // 207 Multi-Status
      }
      
      return sendSuccess(res, {
        message: 'Companies imported successfully',
        imported: result.count
      }, undefined, 201);
    } catch (error) {
      next(error);
    }
  };
}
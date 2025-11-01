import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService.js';
import { sendSuccess, sendError } from '../utils/standardResponse.js';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getDashboard(req: Request, res: Response) {
    try {
      const stats = await analyticsService.getDashboardStats();
      return sendSuccess(res, stats);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  async getCompanyStats(req: Request, res: Response) {
    try {
      const stats = await analyticsService.getCompanyStats();
      return sendSuccess(res, stats);
    } catch (error) {
      console.error('Get company stats error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  async getTaskStats(req: Request, res: Response) {
    try {
      const stats = await analyticsService.getTaskStats();
      return sendSuccess(res, stats);
    } catch (error) {
      console.error('Get task stats error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  async getTicketStats(req: Request, res: Response) {
    try {
      const stats = await analyticsService.getTicketStats();
      return sendSuccess(res, stats);
    } catch (error) {
      console.error('Get ticket stats error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  async getActivityStats(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const stats = await analyticsService.getActivityStats(days);
      return sendSuccess(res, stats);
    } catch (error) {
      console.error('Get activity stats error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }
}
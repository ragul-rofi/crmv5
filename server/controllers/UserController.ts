import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth.js';
import { UserService } from '../services/UserService.js';
import { getPaginationParams } from '../utils/pagination.js';
import { sendSuccess, sendError } from '../utils/standardResponse.js';

export class UserController {
  private userService = new UserService();

  getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const pagination = getPaginationParams(req.query);
      const result = await this.userService.findAll(pagination);
      return sendSuccess(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  };

  getUsersList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.getUsersList();
      return sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  };

  getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.findById(req.params.id);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }
      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }
      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const deleted = await this.userService.deleteUser(req.params.id);
      if (!deleted) {
        return sendError(res, 'User not found', 404);
      }
      return sendSuccess(res, { message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
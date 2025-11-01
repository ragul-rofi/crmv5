import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth.js';
import { TaskService } from '../services/TaskService.js';
import { getPaginationParams } from '../utils/pagination.js';
import { transformKeysToCamelCase } from '../utils/caseTransform.js';

export class TaskController {
  private taskService = new TaskService();

  getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const pagination = getPaginationParams(req.query);
      const result = await this.taskService.findAll(pagination);
      res.json({
        data: transformKeysToCamelCase(result.data),
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  getMyTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const pagination = getPaginationParams(req.query);
      const result = await this.taskService.findMyTasks(req.user!.id, pagination);
      res.json({
        data: transformKeysToCamelCase(result.data),
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  getMyOpenTasksCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const count = await this.taskService.getMyOpenTasksCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  };

  createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const task = await this.taskService.createTask(req.body, req.user!.id);
      res.status(201).json(transformKeysToCamelCase(task));
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const task = await this.taskService.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(transformKeysToCamelCase(task));
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const deleted = await this.taskService.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
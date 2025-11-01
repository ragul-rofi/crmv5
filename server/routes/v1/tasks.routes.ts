import { Router } from 'express';
import { TaskController } from '../../controllers/TaskController.js';
import { verifyToken } from '../../auth.js';
import { requireTaskAssigners, enforceTaskUpdatePermission } from '../../middleware/roleMiddleware.js';
import { validateRequest, validateParams } from '../../middleware/validation.js';
import { createTaskSchema, updateTaskSchema, uuidParamSchema } from '../../schemas/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = Router();
const taskController = new TaskController();

// Get all tasks with pagination
router.get('/', verifyToken, asyncHandler(taskController.getTasks));

// Get tasks assigned to current user with pagination
router.get('/my', verifyToken, asyncHandler(taskController.getMyTasks));

// Get count of open tasks for current user
router.get('/my/count', verifyToken, asyncHandler(taskController.getMyOpenTasksCount));

// Create task (Admin and Manager only - can assign tasks)
router.post('/', verifyToken, requireTaskAssigners, validateRequest(createTaskSchema), asyncHandler(taskController.createTask));

// Update task (Managers can update any task content, DataCollector/Converter can update only status of their assigned tasks)
router.put('/:id', verifyToken, enforceTaskUpdatePermission, validateParams(uuidParamSchema), validateRequest(updateTaskSchema), asyncHandler(taskController.updateTask));

// Delete task (Admin and Manager only)
router.delete('/:id', verifyToken, requireTaskAssigners, validateParams(uuidParamSchema), asyncHandler(taskController.deleteTask));

export default router;
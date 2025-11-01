import { Router } from 'express';
import { UserController } from '../../controllers/UserController.js';
import { verifyToken } from '../../auth.js';
import { requireUserManagers, requireAdmin } from '../../middleware/roleMiddleware.js';
import { validateRequest, validateParams } from '../../middleware/validation.js';
import { updateUserSchema, uuidParamSchema } from '../../schemas/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = Router();
const userController = new UserController();

// Get users list for dropdowns (all authenticated users)
router.get('/list', verifyToken, asyncHandler(userController.getUsersList));

// Get all users (Admin and Manager only) with pagination
router.get('/', verifyToken, requireUserManagers, asyncHandler(userController.getUsers));

// Get single user
router.get('/:id', verifyToken, asyncHandler(userController.getUser));

// Update user (Admin and Manager only)
router.put('/:id', verifyToken, requireUserManagers, validateParams(uuidParamSchema), validateRequest(updateUserSchema), asyncHandler(userController.updateUser));

// Delete user (admin only)
router.delete('/:id', verifyToken, requireAdmin, validateParams(uuidParamSchema), asyncHandler(userController.deleteUser));

export default router;
import { Router } from 'express';
import { NotificationController } from '../../controllers/NotificationController.js';
import { verifyToken } from '../../auth.js';
import { validateParams } from '../../middleware/validation.js';
import { uuidParamSchema } from '../../schemas/validation.js';

const router = Router();
const notificationController = new NotificationController();

router.get('/', verifyToken, notificationController.getMyNotifications.bind(notificationController));
router.get('/count', verifyToken, notificationController.getUnreadCount.bind(notificationController));
router.put('/:id/read', verifyToken, validateParams(uuidParamSchema), notificationController.markAsRead.bind(notificationController));
router.put('/read-all', verifyToken, notificationController.markAllAsRead.bind(notificationController));
router.delete('/:id', verifyToken, validateParams(uuidParamSchema), notificationController.delete.bind(notificationController));

export default router;
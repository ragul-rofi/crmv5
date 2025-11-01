import { Router } from 'express';
import { AnalyticsController } from '../../controllers/AnalyticsController.js';
import { verifyToken } from '../../auth.js';
import { requireManagers } from '../../middleware/roleMiddleware.js';

const router = Router();
const analyticsController = new AnalyticsController();

router.get('/dashboard', verifyToken, requireManagers, analyticsController.getDashboard.bind(analyticsController));
router.get('/companies', verifyToken, requireManagers, analyticsController.getCompanyStats.bind(analyticsController));
router.get('/tasks', verifyToken, requireManagers, analyticsController.getTaskStats.bind(analyticsController));
router.get('/tickets', verifyToken, requireManagers, analyticsController.getTicketStats.bind(analyticsController));
router.get('/activity', verifyToken, requireManagers, analyticsController.getActivityStats.bind(analyticsController));

export default router;
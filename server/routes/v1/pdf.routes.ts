import { Router } from 'express';
import { PDFController } from '../../controllers/PDFController.js';
import { verifyToken } from '../../auth.js';
import { requireManagers } from '../../middleware/roleMiddleware.js';

const router = Router();
const pdfController = new PDFController();

router.get('/company/:companyId', verifyToken, pdfController.generateCompanyReport.bind(pdfController));
router.get('/tasks', verifyToken, pdfController.generateTaskReport.bind(pdfController));
router.get('/analytics', verifyToken, requireManagers, pdfController.generateAnalyticsReport.bind(pdfController));

export default router;
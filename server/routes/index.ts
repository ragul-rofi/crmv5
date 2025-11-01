import { Router } from 'express';
import healthCheckRoutes from './health-check.routes.js';

const router = Router();

// Non-versioned routes that should remain at /api level
router.use('/health-check', healthCheckRoutes);

export default router;

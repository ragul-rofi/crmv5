import { Router } from 'express';
import { verifyToken, AuthRequest } from '../../auth.js';
import { sendSuccess, sendError } from '../../utils/standardResponse.js';
import { safeLog } from '../../utils/logger.js';
import { validateRequest } from '../../middleware/validation.js';
import { errorLogSchema } from '../../schemas/validation.js';

const router = Router();

/**
 * Log frontend errors for monitoring and debugging
 */
router.post('/', verifyToken, validateRequest(errorLogSchema), async (req: AuthRequest, res) => {
  try {
    const {
      message,
      stack,
      componentStack,
      timestamp,
      userAgent,
      url,
      userId
    } = req.body;

    // Log the error with context
    safeLog.error('Frontend Error Report', {
      message,
      stack,
      componentStack,
      timestamp,
      userAgent,
      url,
      userId: req.user?.id || userId,
      userRole: req.user?.role,
      requestId: res.locals.requestId
    });

    // In production, you might want to:
    // 1. Store in database for analysis
    // 2. Send to external monitoring service (Sentry, LogRocket, etc.)
    // 3. Alert on critical errors
    // 4. Aggregate error metrics

    return sendSuccess(res, { 
      message: 'Error logged successfully',
      errorId: res.locals.requestId 
    });
  } catch (error) {
    safeLog.error('Failed to log frontend error:', error);
    return sendError(res, 'Failed to log error', 500);
  }
});

export default router;
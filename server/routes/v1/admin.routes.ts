import { Router } from 'express';
import { AdminController } from '../../controllers/AdminController.js';
import { query } from '../../db.js';
import { verifyToken } from '../../auth.js';
import { requireAdmin } from '../../middleware/roleMiddleware.js';
import { validateRequest, validateParams } from '../../middleware/validation.js';
import { 
  updateRolePermissionsSchema, 
  updateUserTicketPermissionSchema,
  updateCompanyVisibilitySchema,
  bulkCompanyVisibilitySchema,
  updateSystemSettingSchema,
  userIdParamSchema,
  companyIdParamSchema,
  uuidParamSchema
} from '../../schemas/validation.js';

const router = Router();
const adminController = new AdminController();

// System health
router.get('/health', verifyToken, requireAdmin, async (req, res) => {
  try {
    const dbResult = await query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: dbResult.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// System stats
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [users, companies, tasks, tickets] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM companies'),
      query('SELECT COUNT(*) as count FROM tasks'),
      query('SELECT COUNT(*) as count FROM tickets')
    ]);

    res.json({
      users: parseInt(users.rows[0].count),
      companies: parseInt(companies.rows[0].count),
      tasks: parseInt(tasks.rows[0].count),
      tickets: parseInt(tickets.rows[0].count)
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User management
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, full_name, role, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Role permissions management
router.get('/permissions/roles', verifyToken, requireAdmin, adminController.getRolePermissions.bind(adminController));
router.put('/permissions/roles', verifyToken, requireAdmin, validateRequest(updateRolePermissionsSchema), adminController.updateRolePermissions.bind(adminController));

// User ticket permissions
router.get('/permissions/tickets', verifyToken, requireAdmin, adminController.getUserTicketPermissions.bind(adminController));
router.put('/permissions/tickets/:userId', verifyToken, requireAdmin, validateParams(userIdParamSchema), validateRequest(updateUserTicketPermissionSchema), adminController.updateUserTicketPermission.bind(adminController));

// Company visibility management
router.put('/companies/:companyId/visibility', verifyToken, requireAdmin, validateParams(companyIdParamSchema), validateRequest(updateCompanyVisibilitySchema), adminController.updateCompanyVisibility.bind(adminController));
router.put('/companies/visibility/bulk', verifyToken, requireAdmin, validateRequest(bulkCompanyVisibilitySchema), adminController.bulkUpdateCompanyVisibility.bind(adminController));

// System settings
router.get('/settings', verifyToken, requireAdmin, adminController.getAllSystemSettings.bind(adminController));
router.get('/settings/:key', verifyToken, requireAdmin, adminController.getSystemSetting.bind(adminController));
router.put('/settings/:key', verifyToken, requireAdmin, validateRequest(updateSystemSettingSchema), adminController.updateSystemSetting.bind(adminController));

export default router;
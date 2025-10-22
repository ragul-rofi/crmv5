import { Router } from 'express';
import authRoutes from './auth.routes.js';
import companiesRoutes from './companies.routes.js';
import contactsRoutes from './contacts.routes.js';
import tasksRoutes from './tasks.routes.js';
import ticketsRoutes from './tickets.routes.js';
import usersRoutes from './users.routes.js';
import customFieldsRoutes from './custom-fields.routes.js';
import notificationsRoutes from './notifications.routes.js';
import commentsRoutes from './comments.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companiesRoutes);
router.use('/contacts', contactsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/users', usersRoutes);
router.use('/custom-fields', customFieldsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/comments', commentsRoutes);

export default router;

/**
 * API v1 Routes
 * 
 * This file consolidates all v1 API routes organized by feature domain.
 * All routes are prefixed with /api/v1
 * 
 * Route Organization:
 * - Authentication & User Management: /auth, /users, /sessions
 * - Core Business Entities: /companies, /contacts, /follow-ups
 * - Task & Ticket Management: /tasks, /tickets, /comments
 * - System Features: /custom-fields, /notifications, /files
 * - Data & Analytics: /analytics, /export, /search, /pdf
 * - System Administration: /admin, /monitoring, /errors
 */

import { Router } from 'express';

// Authentication & User Management
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import sessionsRoutes from './sessions.routes.js';
import profileChangesRoutes from './profile-changes.routes.js';

// Core Business Entities
import companiesRoutes from './companies.routes.js';
import contactsRoutes from './contacts.routes.js';
import followUpsRoutes from './follow-ups.routes.js';
import followupDeletionRequestsRoutes from './followup-deletion-requests.routes.js';

// Task & Ticket Management
import tasksRoutes from './tasks.routes.js';
import ticketsRoutes from './tickets.routes.js';
import commentsRoutes from './comments.routes.js';

// System Features
import customFieldsRoutes from './custom-fields.routes.js';
import notificationsRoutes from './notifications.routes.js';
import filesRoutes from './files.routes.js';

// Data & Analytics
import analyticsRoutes from './analytics.routes.js';
import exportRoutes from './export.routes.js';
import searchRoutes from './search.routes.js';
import pdfRoutes from './pdf.routes.js';

// System Administration
import adminRoutes from './admin.routes.js';
import monitoringRoutes from './monitoring.routes.js';
import errorsRoutes from './errors.routes.js';
import auditLogsRoutes from './audit-logs.routes.js';

const router = Router();

/**
 * Authentication & User Management Routes
 * Base path: /api/v1
 */
router.use('/auth', authRoutes);           // Authentication endpoints (login, signup, me)
router.use('/users', usersRoutes);         // User management (CRUD, permissions)
router.use('/sessions', sessionsRoutes);   // Session management
router.use('/profile-changes', profileChangesRoutes); // Profile change approval workflow

/**
 * Core Business Entity Routes
 * Base path: /api/v1
 */
router.use('/companies', companiesRoutes); // Company management (CRUD, finalization)
router.use('/contacts', contactsRoutes);   // Contact management
router.use('/follow-ups', followUpsRoutes); // Follow-up tracking
router.use('/followup-deletion-requests', followupDeletionRequestsRoutes); // Follow-up deletion approval workflow

/**
 * Task & Ticket Management Routes
 * Base path: /api/v1
 */
router.use('/tasks', tasksRoutes);         // Task management (assignment, tracking)
router.use('/tickets', ticketsRoutes);     // Support ticket system
router.use('/comments', commentsRoutes);   // Comments for entities

/**
 * System Feature Routes
 * Base path: /api/v1
 */
router.use('/custom-fields', customFieldsRoutes); // Custom field definitions
router.use('/notifications', notificationsRoutes); // User notifications
router.use('/files', filesRoutes);        // File upload/download

/**
 * Data & Analytics Routes
 * Base path: /api/v1
 */
router.use('/analytics', analyticsRoutes); // Analytics and reporting
router.use('/export', exportRoutes);      // Data export (Excel, CSV)
router.use('/search', searchRoutes);      // Global search functionality
router.use('/pdf', pdfRoutes);           // PDF report generation

/**
 * System Administration Routes
 * Base path: /api/v1
 */
router.use('/admin', adminRoutes);        // Admin panel functionality
router.use('/monitoring', monitoringRoutes); // System monitoring
router.use('/errors', errorsRoutes);      // Error logging and tracking
router.use('/audit-logs', auditLogsRoutes); // Audit log tracking (admin only)

export default router;
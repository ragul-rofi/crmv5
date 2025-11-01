import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['Admin', 'Head', 'SubHead', 'Manager', 'Converter', 'DataCollector']).optional(),
});

// User Schemas
export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().min(2).optional(),
  role: z.enum(['Admin', 'Head', 'SubHead', 'Manager', 'Converter', 'DataCollector']).optional(),
  password: z.string().min(6).optional(),
});

// Company Schemas
export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  conversionStatus: z.enum(['Waiting', 'NoReach', 'Contacted', 'Negotiating', 'Confirmed']).optional(),
  customFields: z.record(z.any()).nullable().optional(),
  // Restored fields
  industry: z.string().nullable().optional(),
    // New fields
    employee_count: z.string().nullable().optional(),
    annual_revenue: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
    contact_person: z.string().min(1, 'Contact person is required'),
  company_type: z.enum(['YES', 'NO']).nullable().optional(),
  status: z.enum(['HOT', 'WARM', 'COLD', 'NEW', 'CLOSED', 'DRIVE COMPLETED', 'ALREADY IN CONTACT', 'IN HOLD']).nullable().optional(),
  rating: z.number().nullable().optional(),
  is_public: z.boolean().optional(),
  assigned_data_collector_id: z.string().uuid().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

// Task Schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().nullable().optional(),
  status: z.enum(['NotYet', 'InProgress', 'Completed']).optional(),
  deadline: z.string().nullable().optional(),
  companyId: z.string().uuid('Invalid company ID').nullable().optional(),
  assignedToId: z.string().uuid('Invalid user ID'),
  // New fields for data collection tasks
  target_count: z.number().nullable().optional(),
  start_date: z.string().nullable().optional(),
  task_type: z.enum(['General', 'DataCollection', 'Review']).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid().optional(),
});

// Ticket Schemas
export const createTicketSchema = z.object({
  title: z.string().min(1, 'Ticket title is required'),
  description: z.string().min(1, 'Description is required'),
  companyId: z.string().uuid('Invalid company ID').nullable().optional(),
  assignedToId: z.string().uuid('Invalid user ID'),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  isResolved: z.boolean().optional(),
  assignedToId: z.string().uuid().optional(),
});

// Contact Schemas
export const createContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  companyId: z.string().uuid('Invalid company ID'),
});

export const updateContactSchema = createContactSchema.partial();

// Custom Field Schemas
export const createCustomFieldSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  type: z.enum(['Text', 'Number', 'Date']),
});

// Notification Schema
export const createNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  message: z.string().min(1, 'Message is required'),
});

// Follow-up Schemas
export const createFollowUpSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  contacted_date: z.string().min(1, 'Contacted date is required').refine((val) => {
    return !isNaN(Date.parse(val));
  }, { message: 'Invalid contacted date format' }),
  follow_up_date: z.string().min(1, 'Follow-up date is required').refine((val) => {
    return !isNaN(Date.parse(val));
  }, { message: 'Invalid follow-up date format' }),
  follow_up_notes: z.string().optional(),
}).refine((data) => {
  const contacted = new Date(data.contacted_date);
  const followUp = new Date(data.follow_up_date);
  return followUp > contacted;
}, {
  message: 'Follow-up date must be after contacted date',
  path: ['follow_up_date']
});

export const updateFollowUpSchema = z.object({
  contacted_date: z.string().optional().refine((val) => {
    if (!val) return true;
    return !isNaN(Date.parse(val));
  }, { message: 'Invalid contacted date format' }),
  follow_up_date: z.string().optional().refine((val) => {
    if (!val) return true;
    return !isNaN(Date.parse(val));
  }, { message: 'Invalid follow-up date format' }),
  follow_up_notes: z.string().optional(),
}).refine((data) => {
  // If both dates are provided, validate the relationship
  if (data.contacted_date && data.follow_up_date) {
    const contacted = new Date(data.contacted_date);
    const followUp = new Date(data.follow_up_date);
    return followUp > contacted;
  }
  return true;
}, {
  message: 'Follow-up date must be after contacted date',
  path: ['follow_up_date']
});

// File Upload Schema
export const fileUploadSchema = z.object({
  entityType: z.enum(['company', 'task', 'ticket', 'user']),
  entityId: z.string().uuid('Invalid entity ID'),
});

// Error Logging Schema
export const errorLogSchema = z.object({
  message: z.string().min(1, 'Error message is required'),
  stack: z.string().optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
});

// Admin Schemas
export const updateRolePermissionsSchema = z.object({
  role: z.enum(['Admin', 'Head', 'SubHead', 'Manager', 'Converter', 'DataCollector']),
  permissions: z.record(z.boolean()),
});

export const updateUserTicketPermissionSchema = z.object({
  canViewAllTickets: z.boolean(),
  canEditAllTickets: z.boolean(),
});

export const updateCompanyVisibilitySchema = z.object({
  isPublic: z.boolean(),
});

export const bulkCompanyVisibilitySchema = z.object({
  companyIds: z.array(z.string().uuid()),
  isPublic: z.boolean(),
});

export const updateSystemSettingSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const bulkApprovalActionSchema = z.object({
  companyIds: z.array(z.string().uuid()),
  action: z.enum(['approve', 'reject']),
});

export const bulkImportCompaniesSchema = z.object({
  companies: z.array(createCompanySchema.omit({ contact_person: true }).extend({
    contact_person: z.string().nullable().optional(),
  })).min(1, 'At least one company is required').max(1000, 'Maximum 1000 companies per import'),
});

// Common parameter schemas
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const companyIdParamSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

// Query parameter schemas
export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const companyQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['HOT', 'WARM', 'COLD', 'NEW', 'CLOSED', 'DRIVE COMPLETED', 'ALREADY IN CONTACT', 'IN HOLD']).optional(),
  conversionStatus: z.enum(['Waiting', 'NoReach', 'Contacted', 'Negotiating', 'Confirmed']).optional(),
  assignedToId: z.string().uuid().optional(),
});

export const taskQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['NotYet', 'InProgress', 'Completed']).optional(),
  assignedToId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
export type ErrorLogInput = z.infer<typeof errorLogSchema>;

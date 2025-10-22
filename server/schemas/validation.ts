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
  conversionStatus: z.enum(['Waiting', 'NoReach', 'Confirmed', 'Finalized']).optional(),
  customFields: z.record(z.any()).nullable().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

// Task Schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().nullable().optional(),
  status: z.enum(['NotYet', 'InProgress', 'Completed']).optional(),
  deadline: z.string().nullable().optional(),
  companyId: z.string().uuid('Invalid company ID'),
  assignedToId: z.string().uuid('Invalid user ID'),
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
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
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

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

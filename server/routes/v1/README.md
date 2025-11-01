# API v1 Routes Documentation

This directory contains all v1 API routes organized by feature domain. All routes are prefixed with `/api/v1`.

## Route Organization

### Authentication & User Management
- **`/auth`** - Authentication endpoints
  - `POST /login` - User login
  - `POST /signup` - User registration
  - `GET /me` - Get current user info
  
- **`/users`** - User management
  - `GET /` - List users (Admin/Manager only)
  - `GET /list` - Get users for dropdowns
  - `GET /:id` - Get single user
  - `PUT /:id` - Update user (Admin/Manager only)
  - `DELETE /:id` - Delete user (Admin only)
  
- **`/sessions`** - Session management
  - `GET /` - List user sessions
  - `DELETE /:sessionId` - Terminate specific session
  - `DELETE /others/all` - Terminate all other sessions

### Core Business Entities
- **`/companies`** - Company management
  - `GET /` - List companies with pagination
  - `GET /my` - Get companies assigned to current user
  - `GET /finalized` - Get finalized companies
  - `GET /approvals` - Get approval queue
  - `GET /:id` - Get single company
  - `POST /` - Create company
  - `PUT /:id` - Update company
  - `PUT /:id/finalize` - Finalize company
  - `DELETE /:id` - Delete company
  
- **`/contacts`** - Contact management
  - `GET /` - List contacts with pagination
  - `POST /` - Create contact
  - `PUT /:id` - Update contact
  - `DELETE /:id` - Delete contact
  
- **`/follow-ups`** - Follow-up tracking
  - `GET /` - Get follow-ups for a company
  - `POST /` - Create follow-up
  - `PUT /:id` - Update follow-up
  - `DELETE /:id` - Delete follow-up

### Task & Ticket Management
- **`/tasks`** - Task management
  - `GET /` - List tasks with pagination
  - `GET /my` - Get tasks assigned to current user
  - `GET /my/count` - Get count of open tasks for current user
  - `POST /` - Create task (Admin/Manager only)
  - `PUT /:id` - Update task
  - `DELETE /:id` - Delete task (Admin/Manager only)
  
- **`/tickets`** - Support ticket system
  - `GET /` - List tickets with pagination
  - `GET /my` - Get tickets assigned to current user
  - `GET /my/count` - Get count of open tickets for current user
  - `POST /` - Create ticket
  - `PUT /:id` - Update ticket
  - `DELETE /:id` - Delete ticket (Admin/Manager only)
  
- **`/comments`** - Comments for entities
  - `GET /:entityType/:entityId` - Get comments for entity
  - `POST /` - Create comment
  - `PUT /:id` - Update comment
  - `DELETE /:id` - Delete comment

### System Features
- **`/custom-fields`** - Custom field definitions
  - `GET /` - List custom field definitions
  - `POST /` - Create custom field (Admin/Manager only)
  - `DELETE /:id` - Delete custom field (Admin/Manager only)
  
- **`/notifications`** - User notifications
  - `GET /` - Get user notifications
  - `GET /count` - Get unread notification count
  - `PUT /:id/read` - Mark notification as read
  - `PUT /read-all` - Mark all notifications as read
  - `DELETE /:id` - Delete notification
  
- **`/files`** - File upload/download
  - `POST /upload` - Upload file
  - `GET /:entityType/:entityId` - Get files for entity
  - `GET /download/:fileId` - Download file
  - `DELETE /:fileId` - Delete file

### Data & Analytics
- **`/analytics`** - Analytics and reporting (Manager+ only)
  - `GET /dashboard` - Get dashboard analytics
  - `GET /companies` - Get company statistics
  - `GET /tasks` - Get task statistics
  - `GET /tickets` - Get ticket statistics
  - `GET /activity` - Get activity statistics
  
- **`/export`** - Data export (Manager+ only)
  - `GET /companies` - Export companies to Excel
  - `GET /companies/finalized` - Export finalized companies
  - `GET /tasks` - Export tasks to Excel
  - `GET /tickets` - Export tickets to Excel
  
- **`/search`** - Global search functionality
  - `GET /` - Global search across entities
  - `GET /companies` - Search companies with pagination
  
- **`/pdf`** - PDF report generation
  - `GET /company/:companyId` - Generate company report
  - `GET /tasks` - Generate task report
  - `GET /analytics` - Generate analytics report (Manager+ only)

### System Administration
- **`/admin`** - Admin panel functionality (Admin only)
  - `GET /health` - System health check
  - `GET /stats` - System statistics
  - `GET /users` - Admin user management
  - `GET /permissions/roles` - Get role permissions
  - `PUT /permissions/roles` - Update role permissions
  - `GET /permissions/tickets` - Get user ticket permissions
  - `PUT /permissions/tickets/:userId` - Update user ticket permission
  - `PUT /companies/:companyId/visibility` - Update company visibility
  - `PUT /companies/visibility/bulk` - Bulk update company visibility
  - `GET /settings` - Get system settings
  - `GET /settings/:key` - Get specific setting
  - `PUT /settings/:key` - Update setting
  
- **`/monitoring`** - System monitoring (Admin only)
  - `GET /metrics` - Get system metrics
  - `GET /database` - Get database status
  - `GET /activity` - Get recent activity
  
- **`/errors`** - Error logging and tracking
  - `POST /` - Log frontend error

## Authentication & Authorization

Most routes require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

### Role-based Access Control
- **Admin**: Full access to all endpoints
- **Manager**: Access to most endpoints, can manage users and view analytics
- **DataCollector**: Can create/edit companies, tasks, tickets
- **Converter**: Limited to updating task status for assigned tasks
- **ReadOnly**: Read-only access to assigned data

## Response Format

All v1 API endpoints return responses in the standardized format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
  timestamp: string;
}
```

## Error Handling

Errors are returned in the same standardized format with appropriate HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Pagination

List endpoints support pagination with query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 50)

## Legacy Route Compatibility

Legacy `/api` routes are automatically redirected to `/api/v1` with a 301 status code for backward compatibility.
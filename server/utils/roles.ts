/**
 * Centralized Role-Based Access Control (RBAC) Configuration
 * Defines permissions for all user roles in the Refined CRM Platform
 */

export type UserRole = 'Admin' | 'Head' | 'SubHead' | 'Manager' | 'DataCollector' | 'Converter';

export interface RolePermissions {
  // Read permissions
  canRead: boolean;
  canReadFinalized: boolean; // Can read finalized/locked data
  
  // Write permissions
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  
  // Task management
  canAssignTasks: boolean;
  canUpdateOwnTasks: boolean; // Can update tasks assigned to them
  canUpdateAllTasks: boolean; // Can update any task
  
  // Company/Data finalization
  canFinalize: boolean;
  canEditFinalized: boolean; // Can edit finalized data
  
  // User management
  canManageUsers: boolean;
  
  // Comments/Feedback
  canComment: boolean;
  
  // Custom fields
  canManageCustomFields: boolean;
}

/**
 * Complete role permissions matrix
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Admin: {
    canRead: true,
    canReadFinalized: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canAssignTasks: true,
    canUpdateOwnTasks: true,
    canUpdateAllTasks: true,
    canFinalize: true,
    canEditFinalized: true,
    canManageUsers: true,
    canComment: true,
    canManageCustomFields: true,
  },
  
  Head: {
    canRead: true,
    canReadFinalized: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAssignTasks: false,
    canUpdateOwnTasks: false,
    canUpdateAllTasks: false,
    canFinalize: false,
    canEditFinalized: false,
    canManageUsers: false,
    canComment: true,
    canManageCustomFields: false,
  },
  
  SubHead: {
    canRead: true,
    canReadFinalized: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAssignTasks: false,
    canUpdateOwnTasks: false,
    canUpdateAllTasks: false,
    canFinalize: false,
    canEditFinalized: false,
    canManageUsers: false,
    canComment: true,
    canManageCustomFields: false,
  },
  
  Manager: {
    canRead: true,
    canReadFinalized: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canAssignTasks: true,
    canUpdateOwnTasks: true,
    canUpdateAllTasks: true,
    canFinalize: true,
    canEditFinalized: false, // Cannot edit finalized data
    canManageUsers: true,
    canComment: true,
    canManageCustomFields: true,
  },
  
  DataCollector: {
    canRead: true,
    canReadFinalized: false,
    canCreate: true,  // Can add company data
    canEdit: true,    // Can manage and update company data
    canDelete: true,  // Can remove company data
    canAssignTasks: false,
    canUpdateOwnTasks: true, // Can update their assigned tasks
    canUpdateAllTasks: false,
    canFinalize: false,
    canEditFinalized: false,
    canManageUsers: false,
    canComment: false,
    canManageCustomFields: false,
  },
  
  Converter: {
    canRead: true,
    canReadFinalized: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAssignTasks: false,
    canUpdateOwnTasks: true, // Can update their assigned conversion tasks
    canUpdateAllTasks: false,
    canFinalize: false,
    canEditFinalized: false,
    canManageUsers: false,
    canComment: false,
    canManageCustomFields: false,
  },
};

/**
 * Get permissions for a specific role
 */
export const getPermissions = (role: UserRole): RolePermissions => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.DataCollector; // Default to most restrictive
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: UserRole, permission: keyof RolePermissions): boolean => {
  return getPermissions(role)[permission];
};

/**
 * Role groups for common access patterns
 */
export const ROLE_GROUPS = {
  // Can manage all data (CRUD)
  MANAGERS: ['Admin', 'Manager'] as UserRole[],
  
  // Can manage company data (CRUD)
  DATA_MANAGERS: ['Admin', 'Manager', 'DataCollector'] as UserRole[],
  
  // Read-only with comment access
  READ_ONLY_WITH_COMMENTS: ['Head', 'SubHead'] as UserRole[],
  
  // Can update their own tasks
  TASK_WORKERS: ['DataCollector', 'Converter'] as UserRole[],
  
  // Can assign tasks to others
  TASK_ASSIGNERS: ['Admin', 'Manager'] as UserRole[],
  
  // Can finalize data
  FINALIZERS: ['Admin', 'Manager'] as UserRole[],
  
  // Can manage users
  USER_MANAGERS: ['Admin', 'Manager'] as UserRole[],
  
  // Can manage custom fields
  CUSTOM_FIELD_MANAGERS: ['Admin', 'Manager'] as UserRole[],
};

/**
 * Check if a role is in a specific group
 */
export const isInRoleGroup = (role: UserRole, group: UserRole[]): boolean => {
  return group.includes(role);
};

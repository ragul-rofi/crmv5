/**
 * Centralized Role-Based Access Control (RBAC) Configuration (Frontend)
 * Must match server/utils/roles.ts
 */

export type UserRole = 'Admin' | 'Head' | 'SubHead' | 'Manager' | 'DataCollector' | 'Converter';

export interface RolePermissions {
  // Read permissions
  canRead: boolean;
  canReadFinalized: boolean;
  
  // Write permissions
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canBulkDelete: boolean; // Separate permission for bulk operations
  
  // Task management
  canAssignTasks: boolean;
  canUpdateOwnTasks: boolean;
  canUpdateAllTasks: boolean;
  
  // Company/Data finalization
  canFinalize: boolean;
  canEditFinalized: boolean;
  
  // User management
  canManageUsers: boolean;
  
  // Comments/Feedback
  canComment: boolean;
  
  // Custom fields
  canManageCustomFields: boolean;
  
  // Export finalized data
  canExportFinalized: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  "Admin": {
    "canRead": true,
    "canReadFinalized": true,
    "canCreate": true,
    "canEdit": true,
    "canDelete": true,
    "canBulkDelete": true,
    "canAssignTasks": true,
    "canUpdateOwnTasks": true,
    "canUpdateAllTasks": true,
    "canFinalize": true,
    "canEditFinalized": true,
    "canManageUsers": true,
    "canComment": true,
    "canManageCustomFields": true,
    "canExportFinalized": true
  },
  "Head": {
    "canRead": true,
    "canReadFinalized": true,
    "canCreate": false,
    "canEdit": false,
    "canDelete": false,
    "canBulkDelete": false,
    "canAssignTasks": true,
    "canUpdateOwnTasks": false,
    "canUpdateAllTasks": false,
    "canFinalize": false,
    "canEditFinalized": false,
    "canManageUsers": false,
    "canComment": true,
    "canManageCustomFields": false,
    "canExportFinalized": true
  },
  "SubHead": {
    "canRead": true,
    "canReadFinalized": true,
    "canCreate": false,
    "canEdit": false,
    "canDelete": false,
    "canBulkDelete": false,
    "canAssignTasks": true,
    "canUpdateOwnTasks": false,
    "canUpdateAllTasks": false,
    "canFinalize": false,
    "canEditFinalized": false,
    "canManageUsers": false,
    "canComment": true,
    "canManageCustomFields": false,
    "canExportFinalized": true
  },
  "Manager": {
    "canRead": true,
    "canReadFinalized": true,
    "canCreate": true,
    "canEdit": true,
    "canDelete": true,
    "canBulkDelete": true,
    "canAssignTasks": true,
    "canUpdateOwnTasks": true,
    "canUpdateAllTasks": true,
    "canFinalize": true,
    "canEditFinalized": true,
    "canManageUsers": true,
    "canComment": true,
    "canManageCustomFields": true,
    "canExportFinalized": true
  },
  "DataCollector": {
    "canRead": true,
    "canReadFinalized": false,
    "canCreate": true,
    "canEdit": true,
    "canDelete": true,
    "canBulkDelete": true,
    "canAssignTasks": false,
    "canUpdateOwnTasks": true,
    "canUpdateAllTasks": false,
    "canFinalize": false,
    "canEditFinalized": false,
    "canManageUsers": false,
    "canComment": false,
    "canManageCustomFields": false,
    "canExportFinalized": false
  },
  "Converter": {
    "canRead": true,
    "canReadFinalized": false,
    "canCreate": false,
    "canEdit": true,
    "canDelete": false,
    "canBulkDelete": false,
    "canAssignTasks": false,
    "canUpdateOwnTasks": true,
    "canUpdateAllTasks": false,
    "canFinalize": true,
    "canEditFinalized": false,
    "canManageUsers": false,
    "canComment": true,
    "canManageCustomFields": false,
    "canExportFinalized": false
  }
};

export const getPermissions = (role: UserRole | null | undefined): RolePermissions => {
  if (!role) {
    // Return most restrictive permissions for unauthenticated users
    return {
      canRead: false,
      canReadFinalized: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canBulkDelete: false,
      canAssignTasks: false,
      canUpdateOwnTasks: false,
      canUpdateAllTasks: false,
      canFinalize: false,
      canEditFinalized: false,
      canManageUsers: false,
      canComment: false,
      canManageCustomFields: false,
      canExportFinalized: false,
    };
  }
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.DataCollector;
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
  
  // Can export finalized data
  FINALIZED_DATA_EXPORTERS: ['Admin', 'Head', 'SubHead', 'Manager'] as UserRole[], // Updated to include Manager
};

/**
 * Check if a role is in a specific group
 */
export const isInRoleGroup = (role: UserRole, group: UserRole[]): boolean => {
  return group.includes(role);
};
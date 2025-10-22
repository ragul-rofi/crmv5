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
}

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
    canEditFinalized: false,
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
    canUpdateOwnTasks: true,
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
    canUpdateOwnTasks: true,
    canUpdateAllTasks: false,
    canFinalize: false,
    canEditFinalized: false,
    canManageUsers: false,
    canComment: false,
    canManageCustomFields: false,
  },
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
      canAssignTasks: false,
      canUpdateOwnTasks: false,
      canUpdateAllTasks: false,
      canFinalize: false,
      canEditFinalized: false,
      canManageUsers: false,
      canComment: false,
      canManageCustomFields: false,
    };
  }
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.DataCollector;
};

export const hasPermission = (role: UserRole | null | undefined, permission: keyof RolePermissions): boolean => {
  return getPermissions(role)[permission];
};

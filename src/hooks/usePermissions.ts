import { useUser } from "@/contexts/UserContext";
import { getPermissions, hasPermission, UserRole } from "@/utils/roles";

export const usePermissions = () => {
  const { userProfile } = useUser();
  const role = userProfile?.role as UserRole | undefined;

  const permissions = getPermissions(role);

  return {
    // Core permissions from centralized config
    ...permissions,
    
    // Legacy compatibility properties
    canViewData: permissions.canRead,
    canManageData: permissions.canEdit || permissions.canCreate || permissions.canDelete,
    canViewTasks: permissions.canRead,
    canManageTasks: permissions.canUpdateAllTasks || permissions.canAssignTasks,
    isManager: role === 'Admin' || role === 'Manager',
    isReadOnly: role === 'Head' || role === 'SubHead',
    
    // Utility function to check specific permissions
    hasPermission: (permission: keyof typeof permissions) => hasPermission(role, permission),
    
    // Current user role
    role,
  };
};
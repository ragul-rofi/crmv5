import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Users, Settings, Database } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { Navigate } from "react-router-dom";
import { ROLE_PERMISSIONS, UserRole, RolePermissions } from "@/utils/roles";

const AdminPanel = () => {
  const permissions = usePermissions();
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(ROLE_PERMISSIONS);
  const [hasChanges, setHasChanges] = useState(false);

  // Protect the route - only Admin can access
  if (permissions.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  const handlePermissionToggle = (role: UserRole, permission: keyof RolePermissions) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: !prev[role][permission]
      }
    }));
    setHasChanges(true);
  };

  const handleSavePermissions = () => {
    // In a real implementation, this would save to backend
    toast.success("Permission changes saved successfully!");
    setHasChanges(false);
    
    // TODO: Implement API call to save permissions
    // await api.updateRolePermissions(rolePermissions);
  };

  const handleResetPermissions = () => {
    setRolePermissions(ROLE_PERMISSIONS);
    setHasChanges(false);
    toast.info("Permissions reset to default");
  };

  const roles: UserRole[] = ['Admin', 'Head', 'SubHead', 'Manager', 'DataCollector', 'Converter'];

  const permissionLabels: Record<keyof RolePermissions, { label: string; description: string }> = {
    canRead: { label: "Read Data", description: "View all data in the system" },
    canReadFinalized: { label: "Read Finalized", description: "View finalized/locked data" },
    canCreate: { label: "Create Data", description: "Add new companies, contacts, etc." },
    canEdit: { label: "Edit Data", description: "Modify existing data" },
    canDelete: { label: "Delete Data", description: "Remove data from system" },
    canAssignTasks: { label: "Assign Tasks", description: "Create and assign tasks to others" },
    canUpdateOwnTasks: { label: "Update Own Tasks", description: "Update tasks assigned to them" },
    canUpdateAllTasks: { label: "Update All Tasks", description: "Update any task in the system" },
    canFinalize: { label: "Finalize Data", description: "Lock data and forward to Head/SubHead" },
    canEditFinalized: { label: "Edit Finalized", description: "Modify finalized/locked data" },
    canManageUsers: { label: "Manage Users", description: "Create, edit, delete user accounts" },
    canComment: { label: "Add Comments", description: "Add feedback and comments" },
    canManageCustomFields: { label: "Manage Custom Fields", description: "Create and manage custom fields" },
  };

  const renderPermissionControl = (role: UserRole, permission: keyof RolePermissions) => {
    const isDisabled = role === 'Admin'; // Admin permissions cannot be changed
    const info = permissionLabels[permission];

    return (
      <div key={permission} className="flex items-center justify-between py-3 border-b last:border-0">
        <div className="space-y-0.5">
          <Label htmlFor={`${role}-${permission}`} className="text-sm font-medium">
            {info.label}
          </Label>
          <p className="text-xs text-muted-foreground">{info.description}</p>
        </div>
        <Switch
          id={`${role}-${permission}`}
          checked={rolePermissions[role][permission]}
          onCheckedChange={() => handlePermissionToggle(role, permission)}
          disabled={isDisabled}
        />
      </div>
    );
  };

  return (
    <div className="p-8 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage role permissions and system privileges
          </p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetPermissions}>
              Reset Changes
            </Button>
            <Button onClick={handleSavePermissions}>
              Save Permissions
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="permissions" className="w-full">
        <TabsList>
          <TabsTrigger value="permissions">
            <Shield className="mr-2 h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            User Overview
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access Control</CardTitle>
              <CardDescription>
                Configure permissions for each user role. Admin permissions cannot be modified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="Admin" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  {roles.map(role => (
                    <TabsTrigger key={role} value={role}>
                      {role}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {roles.map(role => (
                  <TabsContent key={role} value={role} className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">{role} Role</h3>
                      <p className="text-sm text-muted-foreground">
                        {role === 'Admin' && 'Full system control with unrestricted access to all features.'}
                        {role === 'Head' && 'Read-only access to finalized data with comment capabilities.'}
                        {role === 'SubHead' && 'Regional read-only access to finalized data with comment capabilities.'}
                        {role === 'Manager' && 'Full CRUD operations, can finalize data and assign tasks.'}
                        {role === 'DataCollector' && 'Manages company data - add, edit, update, and remove companies.'}
                        {role === 'Converter' && 'Updates conversion status and raises tickets for data corrections.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      {role === 'Admin' && (
                        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded-md mb-4">
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Note:</strong> Admin permissions are locked and cannot be modified to ensure system security.
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Data Access</h4>
                          {renderPermissionControl(role, 'canRead')}
                          {renderPermissionControl(role, 'canReadFinalized')}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Data Management</h4>
                          {renderPermissionControl(role, 'canCreate')}
                          {renderPermissionControl(role, 'canEdit')}
                          {renderPermissionControl(role, 'canDelete')}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Task Management</h4>
                          {renderPermissionControl(role, 'canAssignTasks')}
                          {renderPermissionControl(role, 'canUpdateOwnTasks')}
                          {renderPermissionControl(role, 'canUpdateAllTasks')}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Advanced Permissions</h4>
                          {renderPermissionControl(role, 'canFinalize')}
                          {renderPermissionControl(role, 'canEditFinalized')}
                          {renderPermissionControl(role, 'canManageUsers')}
                          {renderPermissionControl(role, 'canComment')}
                          {renderPermissionControl(role, 'canManageCustomFields')}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Overview</CardTitle>
              <CardDescription>
                View and manage user accounts across all roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/users'}>
                  <Users className="mr-2 h-4 w-4" />
                  Go to User Management
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Create, edit, and delete user accounts from the User Management page
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Database Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium text-green-600">Connected</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Database</p>
                    <p className="font-medium">PostgreSQL</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">API Configuration</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Rate Limit (Dev)</p>
                    <p className="font-medium">1000 req/15min</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rate Limit (Prod)</p>
                    <p className="font-medium">100 req/15min</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  View Audit Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;

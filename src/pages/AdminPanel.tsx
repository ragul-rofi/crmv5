import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Users, Settings, Database, Download, LifeBuoy } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { Navigate } from "react-router-dom";
import { ROLE_PERMISSIONS, UserRole, RolePermissions } from "@/utils/roles";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { User } from "@/types";
import { DataTable } from "./data/DataTable";
import { getColumns } from "./users/columns";
import { Company } from "@/types";

const AdminPanel = () => {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(ROLE_PERMISSIONS);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [userTicketPermissions, setUserTicketPermissions] = useState<Record<string, boolean>>({});

  // Protect the route - only Admin can access
  if (permissions.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  // Fetch users for the User Overview tab
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery({
    queryKey: ["admin-users", pagination.pageIndex, pagination.pageSize],
    queryFn: () => api.getUsers(pagination.pageIndex + 1, pagination.pageSize),
    enabled: true,
  });

  const users = usersData?.data || [];
  const paginationInfo = {
    page: usersData?.pagination?.page || 1,
    pages: usersData?.pagination?.pages || 1,
    total: usersData?.pagination?.total || 0,
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: User["role"] }) => {
      return api.updateUser(userId, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User role updated successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(userIds.map(id => api.deleteUser(id)));
      return userIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`${count} users deleted successfully.`);
    },
    onError: (error: Error) => {
      toast.error(`Bulk delete failed: ${error.message}`);
    },
  });

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

  const handleEditUser = (user: User) => {
    // For simplicity, we'll just show a toast. In a real app, you might open a modal.
    toast.info(`Editing user: ${user.full_name}. In a complete implementation, this would open an edit form.`);
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user ${user.full_name}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} users? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleTicketPermissionToggle = async (userId: string, canRaiseTickets: boolean) => {
    try {
      await api.updateUserTicketPermission(userId, canRaiseTickets);
      setUserTicketPermissions(prev => ({
        ...prev,
        [userId]: canRaiseTickets
      }));
      toast.success(`Ticket permission ${canRaiseTickets ? 'enabled' : 'disabled'} for user`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update ticket permission");
    }
  };

  const handleSavePermissions = async () => {
    try {
      await api.updateRolePermissions(rolePermissions);
      toast.success("Permission changes saved successfully!");
      setHasChanges(false);
      // Refresh user data to reflect new permissions
      queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to save permissions");
    }
  };

  const handleResetPermissions = () => {
    setRolePermissions(ROLE_PERMISSIONS);
    setHasChanges(false);
    toast.info("Permissions reset to default");
  };

  const handleExportFinalized = async () => {
    try {
      setIsExporting(true);
      toast.info('Export started. Preparing your file...');
      
      // Create a temporary link to trigger the download
      const response = await fetch('/api/v1/export/companies/finalized', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finalized_companies_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Export completed successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const roles: UserRole[] = ['Admin', 'Head', 'SubHead', 'Manager', 'DataCollector', 'Converter'];

  // Get user columns with actions
  const userColumns = getColumns(
    handleEditUser,
    handleDeleteUser,
    true, // Enable selection
    true  // Is admin
  );

  const permissionLabels: Record<keyof RolePermissions, { label: string; description: string }> = {
    canRead: { label: "Read Data", description: "View all data in the system" },
    canReadFinalized: { label: "Read Finalized", description: "View finalized/locked data" },
    canCreate: { label: "Create Data", description: "Add new companies, contacts, etc." },
    canEdit: { label: "Edit Data", description: "Modify existing data" },
    canDelete: { label: "Delete Data", description: "Remove individual data from system" },
    canBulkDelete: { label: "Bulk Delete", description: "Remove multiple items at once" },
    canAssignTasks: { label: "Assign Tasks", description: "Create and assign tasks to others" },
    canUpdateOwnTasks: { label: "Update Own Tasks", description: "Update tasks assigned to them" },
    canUpdateAllTasks: { label: "Update All Tasks", description: "Update any task in the system" },
    canFinalize: { label: "Finalize Data", description: "Lock data and forward to Head/SubHead" },
    canEditFinalized: { label: "Edit Finalized", description: "Modify finalized/locked data" },
    canManageUsers: { label: "Manage Users", description: "Create, edit, delete user accounts" },
    canComment: { label: "Add Comments", description: "Add feedback and comments" },
    canManageCustomFields: { label: "Manage Custom Fields", description: "Create and manage custom fields" },
    canExportFinalized: { label: "Export Finalized Data", description: "Export finalized company data to Excel" },
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
    <div className="p-4 md:p-8 pt-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 md:h-8 md:w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage role permissions and system privileges
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleResetPermissions} className="w-full sm:w-auto">
                Reset Changes
              </Button>
              <Button onClick={handleSavePermissions} className="w-full sm:w-auto">
                Save Permissions
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="permissions" className="flex items-center justify-center">
            <Shield className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Permissions</span>
            <span className="sm:hidden">Perms</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center justify-center">
            <Users className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">User Overview</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="profile-requests" className="flex items-center justify-center">
            <Users className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Profile Requests</span>
            <span className="sm:hidden">Requests</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center justify-center">
            <Settings className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">System Settings</span>
            <span className="sm:hidden">System</span>
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
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
                  {roles.map(role => (
                    <TabsTrigger key={role} value={role} className="text-xs sm:text-sm">
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
                          {renderPermissionControl(role, 'canBulkDelete')}
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
                          {renderPermissionControl(role, 'canExportFinalized')}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Ticket Permissions</h4>
                          <UserTicketPermissions 
                            role={role} 
                            users={users} 
                            userTicketPermissions={userTicketPermissions}
                            onToggle={handleTicketPermissionToggle} 
                          />
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
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage user accounts across all roles with multi-selection capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div>Loading users...</div>
              ) : usersError ? (
                <div>Error loading users</div>
              ) : (
                <DataTable
                  columns={userColumns}
                  data={users}
                  filterColumnId="full_name"
                  filterPlaceholder="Filter by user name..."
                  enableRowSelection={true}
                  onBulkDelete={handleBulkDelete}
                  pagination={{
                    pageIndex: pagination.pageIndex,
                    pageSize: pagination.pageSize,
                  }}
                  onPaginationChange={(updater) => {
                    const newState = typeof updater === 'function' 
                      ? updater(pagination) 
                      : updater;
                    setPagination(newState);
                  }}
                  pageCount={paginationInfo.pages}
                  totalCount={paginationInfo.total}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile-requests" className="space-y-4">
          <ProfileChangeRequestsTab />
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
                {/* Company visibility management */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold mb-2">Company Visibility</h4>
                  <CompanyVisibilityControl />
                </div>
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

              <div className="space-y-2">
                <h4 className="font-semibold">Data Export</h4>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleExportFinalized} 
                    className="w-full sm:w-auto"
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? 'Exporting...' : 'Export Finalized Companies (Excel)'}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Export all finalized company data to Excel format
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">System Toggles</h4>
                <SystemToggles />
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

function UserTicketPermissions({ role, users, userTicketPermissions, onToggle }: { 
  role: UserRole; 
  users: User[]; 
  userTicketPermissions: Record<string, boolean>;
  onToggle: (userId: string, canRaise: boolean) => void 
}) {
  const roleUsers = users.filter(user => user.role === role);
  
  if (roleUsers.length === 0) {
    return (
      <div className="flex items-center justify-between py-3 border-b last:border-0">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">No Users</Label>
          <p className="text-xs text-muted-foreground">No {role} users found in the system</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {roleUsers.map((user) => (
        <div key={user.id} className="flex items-center justify-between py-3 border-b last:border-0">
          <div className="space-y-0.5">
            <Label htmlFor={`ticket-${user.id}`} className="text-sm font-medium">
              {user.full_name}
            </Label>
            <p className="text-xs text-muted-foreground">Allow user to raise tickets</p>
          </div>
          <Switch
            id={`ticket-${user.id}`}
            checked={userTicketPermissions[user.id] || role === 'Admin'}
            onCheckedChange={(checked) => onToggle(user.id, checked)}
            disabled={role === 'Admin'}
          />
        </div>
      ))}
    </div>
  );
}

function SystemToggles() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    enableNotifications: true,
    enableComments: true,
    enableExports: true,
    enableAnalytics: true
  });

  const updateSetting = async (key: string, value: boolean) => {
    try {
      await api.updateSystemSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success(`${key} ${value ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update setting');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Maintenance Mode</Label>
          <p className="text-xs text-muted-foreground">Disable system for maintenance</p>
        </div>
        <Switch
          checked={settings.maintenanceMode}
          onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Allow Registration</Label>
          <p className="text-xs text-muted-foreground">Allow new user registrations</p>
        </div>
        <Switch
          checked={settings.allowRegistration}
          onCheckedChange={(checked) => updateSetting('allowRegistration', checked)}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Enable Notifications</Label>
          <p className="text-xs text-muted-foreground">System-wide notifications</p>
        </div>
        <Switch
          checked={settings.enableNotifications}
          onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Enable Comments</Label>
          <p className="text-xs text-muted-foreground">Allow comments on entities</p>
        </div>
        <Switch
          checked={settings.enableComments}
          onCheckedChange={(checked) => updateSetting('enableComments', checked)}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Enable Exports</Label>
          <p className="text-xs text-muted-foreground">Allow data exports</p>
        </div>
        <Switch
          checked={settings.enableExports}
          onCheckedChange={(checked) => updateSetting('enableExports', checked)}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Enable Analytics</Label>
          <p className="text-xs text-muted-foreground">Analytics dashboard access</p>
        </div>
        <Switch
          checked={settings.enableAnalytics}
          onCheckedChange={(checked) => updateSetting('enableAnalytics', checked)}
        />
      </div>
    </div>
  );
}

function ProfileChangeRequestsTab() {
  const queryClient = useQueryClient();
  
  // Fetch pending profile change requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['admin-profile-requests'],
    queryFn: () => api.getAdminPendingProfileChanges(),
  });

  const requests = requestsData?.requests || [];

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (requestId: string) => api.approveProfileChange(requestId),
    onSuccess: () => {
      toast.success('Profile change approved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-profile-requests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve profile change');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) => 
      api.rejectProfileChange(requestId, reason),
    onSuccess: () => {
      toast.success('Profile change rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-profile-requests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject profile change');
    }
  });

  const handleApprove = (requestId: string) => {
    if (confirm('Are you sure you want to approve this profile change?')) {
      approveMutation.mutate(requestId);
    }
  };

  const handleReject = (requestId: string) => {
    const reason = prompt('Reason for rejection (optional):');
    rejectMutation.mutate({ requestId, reason: reason || undefined });
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Change Requests</CardTitle>
        <CardDescription>
          Review and approve or reject user profile change requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending profile change requests
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request: any) => (
              <Card key={request.id} className="border">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{request.full_name}</span>
                        <span className="text-sm text-muted-foreground">({request.email})</span>
                        <span className="text-xs bg-secondary px-2 py-1 rounded">{request.role}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Requested Changes:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {request.requested_changes.full_name && (
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Full Name:</p>
                              <div className="flex items-center gap-2">
                                <span className="line-through text-muted-foreground">
                                  {request.current_values.full_name}
                                </span>
                                <span>→</span>
                                <span className="font-medium text-green-600">
                                  {request.requested_changes.full_name}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {request.requested_changes.email && (
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Email:</p>
                              <div className="flex items-center gap-2">
                                <span className="line-through text-muted-foreground">
                                  {request.current_values.email}
                                </span>
                                <span>→</span>
                                <span className="font-medium text-green-600">
                                  {request.requested_changes.email}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {request.requested_changes.region && (
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Region:</p>
                              <div className="flex items-center gap-2">
                                <span className="line-through text-muted-foreground">
                                  {request.current_values.region || 'Not set'}
                                </span>
                                <span>→</span>
                                <span className="font-medium text-green-600">
                                  {request.requested_changes.region}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Requested on {new Date(request.requested_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex md:flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="flex-1 md:flex-none"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="flex-1 md:flex-none"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompanyVisibilityControl() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: () => api.getCompanies(1, 100),
  });

  const companies: Company[] = data?.data || [];

  const mutation = useMutation({
    mutationFn: async ({ id, is_public }: { id: string; is_public: boolean }) => {
      return api.updateCompanyVisibility(id, is_public);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company visibility updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update company visibility');
    }
  });

  if (isLoading) return <div>Loading companies...</div>;

  return (
    <div className="overflow-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Visible</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.name}</td>
              <td className="p-2">
                <Switch
                  checked={!!c.is_public}
                  onCheckedChange={(v) => mutation.mutate({ id: c.id, is_public: v as boolean })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

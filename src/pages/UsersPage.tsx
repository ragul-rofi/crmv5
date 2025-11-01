import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "./data/DataTable";
import { getColumns } from "./users/columns";
import EditUserForm from "./users/EditUserForm";
import CreateUserForm from "./users/CreateUserForm";
import { usePermissions } from "@/hooks/usePermissions";
import { Navigate } from "react-router-dom";
import { PaginationState } from "@tanstack/react-table";

const fetchUsers = async (page: number = 1, limit: number = 50) => {
  return api.getUsers(page, limit);
};

const UsersPage = () => {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const {
    data: usersData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users", pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchUsers(pagination.pageIndex + 1, pagination.pageSize),
  });
  
  // Extract data and pagination info
  const users = usersData?.data || [];
  const paginationInfo = {
    page: usersData?.pagination?.page || 1,
    pages: usersData?.pagination?.pages || 1,
    total: usersData?.pagination?.total || 0,
  };

  const updateMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: Partial<User> }) => {
      return api.updateUser(userId, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully.");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (userData: { email: string; full_name: string; role: string; password: string }) => {
      return api.signup(userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully.");
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully.");
      setIsDeleteAlertOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      // Delete users one by one
      await Promise.all(userIds.map(id => api.deleteUser(id)));
      return userIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`${count} users deleted successfully.`);
    },
    onError: (error: Error) => {
      toast.error(`Bulk delete failed: ${error.message}`);
    },
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedIds.length} users? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleUpdateUser = (userId: string, userData: Partial<User>) => {
    updateMutation.mutate({ userId, userData });
  };

  const handleCreateUser = (userData: any) => {
    if (!userData.email || !userData.full_name || !userData.role || !userData.password) {
      toast.error("All fields are required");
      return;
    }
    createMutation.mutate(userData);
  };

  const columns = useMemo(
    () => getColumns(handleEdit, handleDelete, permissions.role === 'Admin', permissions.role === 'Admin'),
    [permissions.role]
  );

  // Protect the route - only Admin and Manager can manage users
  if (!permissions.canManageUsers) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) return <div>Loading users...</div>;
  if (isError) return <div>Error fetching users</div>;

  return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="btn-primary">Add User</Button>
        </div>
        <DataTable
          columns={columns}
          data={users || []}
          filterColumnId="full_name"
          filterPlaceholder="Filter by user name..."
          enableRowSelection={permissions.role === 'Admin'}
          onBulkDelete={permissions.role === 'Admin' ? handleBulkDelete : undefined}
          pagination={{
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
          }}
          onPaginationChange={setPagination}
          pageCount={paginationInfo.pages}
          totalCount={paginationInfo.total}
        />

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]" aria-describedby="edit-user-dialog-description">
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
              <DialogDescription id="edit-user-dialog-description">
                Update profile information for {selectedUser?.full_name}.
              </DialogDescription>
            </DialogHeader>
            <EditUserForm
              user={selectedUser}
              onSave={handleUpdateUser}
              onCancel={() => setIsEditDialogOpen(false)}
              isSaving={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]" aria-describedby="create-user-dialog-description">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription id="create-user-dialog-description">
                Add a new user to the system.
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm
              onSave={handleCreateUser}
              onCancel={() => setIsCreateDialogOpen(false)}
              isSaving={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent aria-describedby="delete-user-alert-description">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription id="delete-user-alert-description">
                This action cannot be undone. This will permanently delete the
                user account for <strong>{selectedUser?.full_name}</strong> ({selectedUser?.email}).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

export default UsersPage;
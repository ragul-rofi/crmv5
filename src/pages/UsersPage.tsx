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

const fetchUsers = async () => {
  return api.getUsers();
};

const UsersPage = () => {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: User["role"] }) => {
      return api.updateUser(userId, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User role updated successfully.");
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

  const handleUpdateRole = (userId: string, role: User["role"]) => {
    updateMutation.mutate({ userId, role });
  };

  const handleCreateUser = (userData: any) => {
    if (!userData.email || !userData.full_name || !userData.role || !userData.password) {
      toast.error("All fields are required");
      return;
    }
    createMutation.mutate(userData);
  };

  const columns = useMemo(
    () => getColumns(handleEdit, handleDelete, permissions.role === 'Admin'),
    [permissions.role]
  );

  // Protect the route - only Admin and Manager can manage users
  if (!permissions.canManageUsers) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) return <div>Loading users...</div>;
  if (isError) return <div>Error fetching users</div>;

  return (
      <div className="p-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Add User</Button>
        </div>
        <DataTable
          columns={columns}
          data={users || []}
          filterColumnId="full_name"
          filterPlaceholder="Filter by user name..."
        />

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Change the role for {selectedUser?.full_name}.
              </DialogDescription>
            </DialogHeader>
            <EditUserForm
              user={selectedUser}
              onSave={handleUpdateRole}
              onCancel={() => setIsEditDialogOpen(false)}
              isSaving={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
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

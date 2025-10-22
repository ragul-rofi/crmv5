import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Task, Company, User } from "@/types";
import { useUser } from "@/contexts/UserContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { getColumns } from "./tasks/columns";
import TaskForm from "./tasks/TaskForm";
import { KanbanBoard } from "@/components/KanbanBoard";

const fetchTasks = async () => {
  return api.getTasks();
};

const fetchCompanies = async () => {
  return api.getCompanies();
};

const fetchUsers = async () => {
  return api.getUsersList();
};

const TasksPage = () => {
  const queryClient = useQueryClient();
  const { userProfile } = useUser();
  const { canAssignTasks, canUpdateOwnTasks, canUpdateAllTasks, canDelete } = usePermissions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });
  const { data: companies, isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const mutation = useMutation({
    mutationFn: async (
      newTask: Omit<Task, "id" | "created_at" | "companies" | "users"> & { id?: string },
    ) => {
      const { id, ...taskData } = newTask;
      
      if (id) {
        return api.updateTask(id, taskData);
      } else {
        return api.createTask({ ...taskData, assignedById: userProfile!.id });
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`Task ${selectedTask ? "updated" : "added"} successfully.`);
      setIsDialogOpen(false);
      setSelectedTask(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return api.deleteTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully.");
      setIsAlertOpen(false);
      setSelectedTask(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddNew = () => {
    setSelectedTask(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (task: Task) => {
    // Check if user can edit this task
    if (canUpdateAllTasks || (canUpdateOwnTasks && task.assignedToId === userProfile?.id)) {
      setSelectedTask(task);
      setIsDialogOpen(true);
    } else {
      toast.error('You can only edit tasks assigned to you');
    }
  };

  const handleDelete = (task: Task) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete tasks');
      return;
    }
    setSelectedTask(task);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTask) {
      deleteMutation.mutate(selectedTask.id);
    }
  };

  const handleSave = (taskData: Omit<Task, "id" | "created_at" | "assignedById" | "companies" | "users">) => {
    if (selectedTask) {
      // When editing, preserve the assignedById from the existing task
      mutation.mutate({ ...taskData, assignedById: selectedTask.assignedById, id: selectedTask.id });
    } else {
      // When creating, use current user's ID as assignedById
      mutation.mutate({ ...taskData, assignedById: userProfile!.id });
    }
  };

  const columns = useMemo(() => getColumns(handleEdit, handleDelete), []);

  const isLoading = isLoadingTasks || isLoadingCompanies || isLoadingUsers;

  return (
    <div className="p-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tasks</h1>
          {canAssignTasks && <Button onClick={handleAddNew}>Add Task</Button>}
        </div>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            </TabsList>
            <TabsContent value="table">
              <DataTable
                columns={columns}
                data={tasks || []}
                filterColumnId="title"
                filterPlaceholder="Filter by task title..."
              />
            </TabsContent>
            <TabsContent value="kanban">
              <KanbanBoard
                tasks={tasks || []}
                onTaskClick={handleEdit}
              />
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedTask ? "Edit Task" : "Add New Task"}
              </DialogTitle>
              <DialogDescription>
                {selectedTask
                  ? "Update the details of the task."
                  : "Enter the details for the new task."}
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              task={selectedTask}
              companies={companies || []}
              users={users || []}
              onSave={handleSave}
              onCancel={() => setIsDialogOpen(false)}
              isSaving={mutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                task &quot;{selectedTask?.title}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

export default TasksPage;

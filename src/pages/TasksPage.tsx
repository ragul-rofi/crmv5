import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Task, User } from "@/types";
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
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { PaginationState } from "@tanstack/react-table";

const fetchTasks = async (page: number = 1, limit: number = 50) => {
  return api.getTasks(page, limit);
};

const fetchMyTasks = async (page: number = 1, limit: number = 50) => {
  return api.getMyTasks(page, limit);
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
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  // Fetch all tasks if user can update all tasks (Admin/Manager), otherwise fetch only assigned tasks
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: canUpdateAllTasks ? ["tasks", "all", pagination.pageIndex, pagination.pageSize] : ["tasks", "my", pagination.pageIndex, pagination.pageSize],
    queryFn: () => canUpdateAllTasks 
      ? fetchTasks(pagination.pageIndex + 1, pagination.pageSize)
      : fetchMyTasks(pagination.pageIndex + 1, pagination.pageSize),
  });
  

  
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  // Extract data and pagination info
  const tasks = tasksData?.data || [];
  const paginationInfo = {
    page: tasksData?.pagination?.page || 1,
    pages: tasksData?.pagination?.pages || 1,
    total: tasksData?.pagination?.total || 0,
  };

  const mutation = useMutation({
    mutationFn: async (
      newTask: Omit<Task, "id" | "created_at" | "assignedById" | "users"> & { id?: string },
    ) => {
      const { id, ...taskData } = newTask;
      
      console.log('Saving task data:', taskData);
      
      if (id) {
        return api.updateTask(id, taskData);
      } else {
        return api.createTask(taskData);
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`Task ${selectedTask ? "updated" : "added"} successfully.`);
      setIsDialogOpen(false);
      setSelectedTask(null);
    },
    onError: (error: any) => {
      console.error('Error saving task:', error);
      // Extract validation errors if present
      const errorMessage = error?.message || 'An error occurred while saving the task';
      const validationErrors = error?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        const errorDetails = validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        toast.error(`${errorMessage}: ${errorDetails}`);
      } else {
        toast.error(errorMessage);
      }
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
    // Allow managers to edit all tasks, and users to edit their own tasks
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

  const handleSave = (taskData: Omit<Task, "id" | "created_at" | "assignedById" | "users">) => {
    // Filter out any fields that shouldn't be sent to the API
    // Remove join fields and other non-updatable fields
    const { companies, users, assigned_by_name, ...cleanData } = taskData as any;
    
    // Ensure companyId is null if it's an empty string
    const cleanTaskData = {
      ...cleanData,
      companyId: cleanData.companyId || null
    };
    
    console.log('Saving task with data:', cleanTaskData);
    
    if (selectedTask) {
      // When editing, just send the task data (assignedById is handled by backend)
      mutation.mutate({ ...cleanTaskData, id: selectedTask.id });
    } else {
      // When creating, just send the task data (assignedById is handled by backend)
      mutation.mutate(cleanTaskData);
    }
  };

  const columns = useMemo(() => getColumns(handleEdit, handleDelete), []);

  const isLoading = isLoadingTasks || isLoadingUsers;

  return (
    <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage and track your tasks</p>
          </div>
          {canAssignTasks && <Button onClick={handleAddNew} className="btn-primary">Add Task</Button>}
        </div>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Tabs defaultValue="kanban" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>
            <TabsContent value="kanban">
              <KanbanBoard
                tasks={tasks || []}
                onTaskClick={handleEdit}
                onTaskDelete={handleDelete}
                canDelete={canDelete || canAssignTasks}
              />
            </TabsContent>
            <TabsContent value="table">
              <DataTable
                columns={columns}
                data={tasks || []}
                filterColumnId="title"
                filterPlaceholder="Filter by task title..."
                pagination={{
                  pageIndex: pagination.pageIndex,
                  pageSize: pagination.pageSize,
                }}
                onPaginationChange={setPagination}
                pageCount={paginationInfo.pages}
                totalCount={paginationInfo.total}
              />
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" aria-describedby="task-dialog-description">
            <DialogHeader>
              <DialogTitle>
                {selectedTask ? "Edit Task" : "Add New Task"}
              </DialogTitle>
              <DialogDescription id="task-dialog-description">
                {selectedTask
                  ? "Update the details of the task."
                  : "Enter the details for the new task."}
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              task={selectedTask}
              users={users || []}
              onSave={handleSave}
              onCancel={() => setIsDialogOpen(false)}
              isSaving={mutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent aria-describedby="alert-dialog-description">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription id="alert-dialog-description">
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
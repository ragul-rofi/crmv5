import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task, User } from "@/types";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getAssignableUsers } from "@/utils/hierarchicalAssignment";
import { useUser } from "@/contexts/UserContext";
import { usePermissions } from "@/hooks/usePermissions";

type TaskFormData = Omit<Task, "id" | "created_at" | "assignedById" | "companies" | "users">;

interface TaskFormProps {
  task: Task | null;
  users: User[];
  onSave: (task: TaskFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const TaskForm = ({
  task,
  users,
  onSave,
  onCancel,
  isSaving,
}: TaskFormProps) => {
  const { userProfile } = useUser();
  const { canUpdateAllTasks } = usePermissions();
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "NotYet",
    priority: "Medium",
    deadline: null,
    companyId: null,  // Keep companyId but make it null by default for common tasks
    assignedToId: "",
    target_count: null,
    start_date: null,
    task_type: "General",
  });
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);

  // Check if user is editing their own assigned task (not the assigner)
  const isTaskAssignee = task && userProfile && task.assignedToId === userProfile.id;
  const isTaskAssigner = task && userProfile && task.assignedById === userProfile.id;
  
  // Ensure we have a valid state even if userProfile is not loaded yet
  const isLoaded = !!userProfile;
  
  // Determine if user can edit task content (not just status)
  // Admins/managers can always edit everything regardless of assignment
  // Task assigners can edit everything
  // Task assignees who are not admins/managers can only edit status
  const canEditTaskContent = (canUpdateAllTasks || isTaskAssigner) && isLoaded;
  const canEditStatusOnly = isTaskAssignee && !canUpdateAllTasks && !isTaskAssigner && isLoaded;
  
  // Get assignable users based on hierarchical rules (only for assigners)
  const assignableUsers = userProfile ? getAssignableUsers(users, userProfile.role as "Admin" | "Head" | "SubHead" | "Manager" | "DataCollector" | "Converter") : [];

  // Fallback logic:
  // 1. If we have assignable users from hierarchy, use them
  // 2. If no assignable users but we have a user profile, show DataCollector and Converter users (previous behavior)
  // 3. If no user profile, show all users
  const baseDisplayUsers = assignableUsers.length > 0 
    ? assignableUsers 
    : userProfile 
      ? users.filter(user => user.role === "DataCollector" || user.role === "Converter") 
      : users;
  
  // When editing a task, always include the currently assigned user in the list
  // This ensures the assigned user shows up even if they wouldn't normally be assignable
  const displayUsers = task && task.assignedToId 
    ? (() => {
        const assignedUser = users.find(u => u.id === task.assignedToId);
        if (assignedUser && !baseDisplayUsers.find(u => u.id === assignedUser.id)) {
          return [...baseDisplayUsers, assignedUser];
        }
        return baseDisplayUsers;
      })()
    : baseDisplayUsers;

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "NotYet",
        priority: task.priority || "Medium",
        deadline: task.deadline,
        companyId: task.companyId || null,  // Handle companyId properly
        assignedToId: task.assignedToId || "",
        target_count: task.target_count || null,
        start_date: task.start_date || null,
        task_type: task.task_type || "General",
      });
      if (task.deadline) {
        setDeadline(new Date(task.deadline));
      }
      if (task.start_date) {
        setStartDate(new Date(task.start_date));
      }
    } else {
      // Reset form for new entry
      setFormData({
        title: "",
        description: "",
        status: "NotYet",
        priority: "Medium",
        deadline: null,
        companyId: null,  // Keep companyId null for common tasks
        assignedToId: "",
        target_count: null,
        start_date: null,
        task_type: "General",
      });
      setDeadline(undefined);
      setStartDate(undefined);
    }
  }, [task]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    // If user can only edit status, prevent changes to other fields
    if (canEditStatusOnly && id !== "status") {
      return;
    }
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    // If user can only edit status, prevent changes to other fields
    if (canEditStatusOnly && id !== "status") {
      return;
    }
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleNumberChange = (id: string, value: string) => {
    // If user can only edit status, prevent changes to other fields
    if (canEditStatusOnly && id !== "status") {
      return;
    }
    const numValue = value ? parseInt(value, 10) : null;
    setFormData((prev) => ({ ...prev, [id]: numValue }));
  };

  const handleDateChange = (date: Date | undefined, dateType: 'deadline' | 'start_date') => {
    // If user can only edit status, prevent changes to other fields
    if (canEditStatusOnly) {
      return;
    }
    if (dateType === 'deadline') {
      setDeadline(date);
      setFormData((prev) => ({ ...prev, deadline: date ? date.toISOString() : null }));
    } else {
      setStartDate(date);
      setFormData((prev) => ({ ...prev, start_date: date ? date.toISOString() : null }));
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure companyId is null if empty string
    const formDataToSubmit = {
      ...formData,
      companyId: formData.companyId || null
    };
    onSave(formDataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input 
            id="title" 
            value={formData.title} 
            onChange={handleChange} 
            required 
            disabled={!canEditTaskContent}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="task_type">Task Type</Label>
          <Select 
            onValueChange={(value) => handleSelectChange("task_type", value)} 
            value={formData.task_type}
            disabled={!canEditTaskContent}
          >
            <SelectTrigger id="task_type"><SelectValue placeholder="Select task type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General Task</SelectItem>
              <SelectItem value="DataCollection">Data Collection</SelectItem>
              <SelectItem value="Review">Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={formData.description || ""} 
            onChange={handleChange} 
            disabled={!canEditTaskContent}
          />
        </div>
        {formData.task_type === "DataCollection" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="target_count">Target Count (Number of Companies)</Label>
              <Input 
                id="target_count" 
                type="number" 
                value={formData.target_count || ""} 
                onChange={(e) => handleNumberChange("target_count", e.target.value)} 
                min="0"
                placeholder="Enter number of companies"
                disabled={!canEditTaskContent}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                    disabled={!canEditTaskContent}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={startDate} 
                    onSelect={(date) => handleDateChange(date, 'start_date')} 
                    initialFocus 
                    disabled={!canEditTaskContent}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select 
            onValueChange={(value) => handleSelectChange("priority", value)} 
            value={formData.priority}
            disabled={!canEditTaskContent}
          >
            <SelectTrigger id="priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignedToId">Assign To *</Label>
          <Select 
            onValueChange={(value) => handleSelectChange("assignedToId", value)} 
            value={formData.assignedToId} 
            required
            disabled={!canEditTaskContent}
          >
            <SelectTrigger id="assignedToId"><SelectValue placeholder="Select a user" /></SelectTrigger>
            <SelectContent>
              {displayUsers.length > 0 ? (
                displayUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.role})</SelectItem>)
              ) : (
                <SelectItem value="no-users" disabled>
                  {userProfile ? "No users available for assignment" : "Loading user data..."}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            onValueChange={(value) => handleSelectChange("status", value)} 
            value={formData.status}
          >
            <SelectTrigger id="status"><SelectValue placeholder="Select a status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NotYet">Not Yet</SelectItem>
              <SelectItem value="InProgress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !deadline && "text-muted-foreground"
                )}
                disabled={!canEditTaskContent}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                mode="single" 
                selected={deadline} 
                onSelect={(date) => handleDateChange(date, 'deadline')} 
                initialFocus 
                disabled={!canEditTaskContent}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
      </div>
      {canEditStatusOnly && (
        <div className="text-sm text-blue-600 dark:text-blue-400 mt-2">
          Note: You can only update the status of this task. Contact your manager to modify other details.
        </div>
      )}
    </form>
  );
};

export default TaskForm;
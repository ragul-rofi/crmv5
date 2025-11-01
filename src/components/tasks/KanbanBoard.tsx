import { useState } from "react";
import { Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Target, Clock, Trash2, ArrowUpDown, Users, ListTodo } from "lucide-react";
import { format } from "date-fns";

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  canDelete?: boolean;
}

type SortOption = "user" | "dateAsc" | "dateDesc" | "taskType" | "default";
type ViewMode = "status" | "user";

export const KanbanBoard = ({ tasks, onTaskClick, onTaskDelete, canDelete = false }: KanbanBoardProps) => {
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("status");
  
  // Ensure tasks is always an array
  const validTasks = Array.isArray(tasks) ? tasks : [];
  
  // Get unique users from tasks
  const getUserColumns = () => {
    const userMap = new Map<string, { id: string; name: string; count: number }>();
    
    validTasks.forEach(task => {
      const userId = task.assignedToId || "unassigned";
      const userName = task.assignedToName || task.users?.full_name || "Unassigned";
      
      if (userMap.has(userId)) {
        userMap.get(userId)!.count++;
      } else {
        userMap.set(userId, { id: userId, name: userName, count: 1 });
      }
    });
    
    // Convert to array and sort by name
    return Array.from(userMap.values()).sort((a, b) => {
      if (a.id === "unassigned") return 1;
      if (b.id === "unassigned") return -1;
      return a.name.localeCompare(b.name);
    });
  };

  const userColumns = getUserColumns();
  
  const statusColumns: { status: Task["status"]; label: string; color: string }[] = [
    { status: "NotYet", label: "Not Yet Started", color: "bg-slate-100 dark:bg-slate-800" },
    { status: "InProgress", label: "In Progress", color: "bg-blue-100 dark:bg-blue-900" },
    { status: "Completed", label: "Completed", color: "bg-green-100 dark:bg-green-900" },
  ];

  const sortTasksForStatusView = (tasks: Task[]): Task[] => {
    const tasksCopy = [...tasks];
    
    switch (sortBy) {
      case "user":
        return tasksCopy.sort((a, b) => {
          const nameA = (a.assignedToName || a.users?.full_name || "").toLowerCase();
          const nameB = (b.assignedToName || b.users?.full_name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case "dateAsc":
        return tasksCopy.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
      case "dateDesc":
        return tasksCopy.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        });
      case "taskType":
        return tasksCopy.sort((a, b) => {
          const typeA = a.task_type || "General";
          const typeB = b.task_type || "General";
          return typeA.localeCompare(typeB);
        });
      default:
        return tasksCopy;
    }
  };

  const sortTasksForUserView = (tasks: Task[]): Task[] => {
    const tasksCopy = [...tasks];
    
    switch (sortBy) {
      case "dateAsc":
        return tasksCopy.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
      case "dateDesc":
        return tasksCopy.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        });
      case "taskType":
        return tasksCopy.sort((a, b) => {
          const typeA = a.task_type || "General";
          const typeB = b.task_type || "General";
          return typeA.localeCompare(typeB);
        });
      default:
        // Default sort by status: NotYet -> InProgress -> Completed
        const statusOrder = { NotYet: 0, InProgress: 1, Completed: 2 };
        return tasksCopy.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }
  };

  const tasksByStatus = (status: Task["status"]) => {
    const filtered = validTasks.filter((task) => task.status === status);
    return sortTasksForStatusView(filtered);
  };

  const tasksByUser = (userId: string) => {
    const filtered = validTasks.filter((task) => 
      (task.assignedToId || "unassigned") === userId
    );
    return sortTasksForUserView(filtered);
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* View Mode and Sort Controls */}
      <div className="flex flex-col md:flex-row gap-3 bg-card rounded-lg border p-4">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">View:</span>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "status" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("status")}
              className="gap-2"
            >
              <ListTodo className="h-4 w-4" />
              By Status
            </Button>
            <Button
              variant={viewMode === "user" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("user")}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              By User
            </Button>
          </div>
        </div>

        {/* Sort Options - Only show for User view */}
        {viewMode === "user" && (
          <div className="flex items-center gap-3 md:ml-auto">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select sort option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Status (Not Yet → Completed)</SelectItem>
                <SelectItem value="dateAsc">Deadline (Earliest First)</SelectItem>
                <SelectItem value="dateDesc">Deadline (Latest First)</SelectItem>
                <SelectItem value="taskType">Task Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Kanban Columns - Conditional Rendering */}
      {viewMode === "status" ? (
        // Status-based view
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusColumns.map((column) => (
          <div key={column.status} className="flex flex-col">
            <div className={`${column.color} p-4 rounded-t-lg border border-b-0`}>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{column.label}</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {tasksByStatus(column.status).length} {tasksByStatus(column.status).length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <div className="border border-t-0 rounded-b-lg p-4 space-y-3 min-h-[500px] bg-gray-50 dark:bg-gray-900">
              {tasksByStatus(column.status).map((task) => (
                <Card 
                  key={task.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-400 relative group"
                  onClick={() => onTaskClick(task)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-medium line-clamp-2 flex-1">{task.title}</CardTitle>
                      <div className="flex items-center gap-1">
                        {task.deadline && isOverdue(task.deadline) && column.status !== "Completed" && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                        {canDelete && onTaskDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskDelete(task);
                            }}
                            title="Delete task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{task.description}</p>
                    )}
                    
                    {task.task_type === "DataCollection" && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Target className="h-3 w-3 mr-1" />
                        {task.target_count ? `${task.target_count} companies` : 'No target set'}
                      </div>
                    )}
                    
                    {task.start_date && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Starts: {format(new Date(task.start_date), "MMM dd, yyyy")}
                      </div>
                    )}
                    
                    {task.deadline && (
                      <div className={`flex items-center text-xs ${isOverdue(task.deadline) && column.status !== "Completed" ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <Calendar className="h-3 w-3 mr-1" />
                        Due: {format(new Date(task.deadline), "MMM dd, yyyy")}
                      </div>
                    )}
                    
                    {(task.assignedToName || task.users?.full_name) && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Users className="h-3 w-3 mr-1" />
                        {task.assignedToName || task.users?.full_name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {tasksByStatus(column.status).length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600">
                  <p className="text-sm">No tasks in this column</p>
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      ) : (
        // User-based view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {userColumns.map((column) => (
        <div key={column.id} className="flex flex-col">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 p-4 rounded-t-lg border border-b-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                {column.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <h3 className="font-semibold text-white">{column.name}</h3>
            </div>
            <span className="text-xs text-blue-100 dark:text-blue-200">
              {column.count} {column.count === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <div className="border border-t-0 rounded-b-lg p-4 space-y-3 min-h-[500px] bg-gray-50 dark:bg-gray-900">
            {tasksByUser(column.id).map((task) => (
              <Card 
                key={task.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-400 relative group"
                onClick={() => onTaskClick(task)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium line-clamp-2 mb-2">{task.title}</CardTitle>
                      <div className="flex items-center gap-1">
                        {/* Status Badge */}
                        <Badge 
                          variant={task.status === "Completed" ? "default" : task.status === "InProgress" ? "secondary" : "outline"}
                          className={`text-xs ${
                            task.status === "Completed" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : task.status === "InProgress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {task.status === "NotYet" ? "Not Started" : task.status === "InProgress" ? "In Progress" : "Completed"}
                        </Badge>
                        {task.deadline && isOverdue(task.deadline) && task.status !== "Completed" && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                      </div>
                    </div>
                    {canDelete && onTaskDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskDelete(task);
                        }}
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {task.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{task.description}</p>
                  )}
                  
                  {/* Display data collection task information */}
                  {task.task_type === "DataCollection" && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <Target className="h-3 w-3 mr-1" />
                      {task.target_count ? `${task.target_count} companies` : 'No target set'}
                    </div>
                  )}
                  
                  {task.start_date && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      Starts: {format(new Date(task.start_date), "MMM dd, yyyy")}
                    </div>
                  )}
                  
                  {task.deadline && (
                    <div className={`flex items-center text-xs ${isOverdue(task.deadline) && task.status !== "Completed" ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <Calendar className="h-3 w-3 mr-1" />
                      Due: {format(new Date(task.deadline), "MMM dd, yyyy")}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {tasksByUser(column.id).length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600">
                <p className="text-sm">No tasks assigned</p>
              </div>
            )}
          </div>
        </div>
      ))}
        </div>
      )}
    </div>
  );
};
import { Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Building } from "lucide-react";
import { format } from "date-fns";

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const KanbanBoard = ({ tasks, onTaskClick }: KanbanBoardProps) => {
  const columns: { status: Task["status"]; label: string; color: string }[] = [
    { status: "NotYet", label: "Not Yet Started", color: "bg-slate-100 dark:bg-slate-800" },
    { status: "InProgress", label: "In Progress", color: "bg-blue-100 dark:bg-blue-900" },
    { status: "Completed", label: "Completed", color: "bg-green-100 dark:bg-green-900" },
  ];

  const tasksByStatus = (status: Task["status"]) => 
    tasks.filter((task) => task.status === status);

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => (
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
                className="cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-400"
                onClick={() => onTaskClick(task)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium line-clamp-2">{task.title}</CardTitle>
                    {task.deadline && isOverdue(task.deadline) && column.status !== "Completed" && (
                      <Badge variant="destructive" className="text-xs ml-2">Overdue</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {task.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{task.description}</p>
                  )}
                  {task.deadline && (
                    <div className={`flex items-center text-xs ${isOverdue(task.deadline) && column.status !== "Completed" ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <Calendar className="h-3 w-3 mr-1" />
                      Due: {format(new Date(task.deadline), "MMM dd, yyyy")}
                    </div>
                  )}
                  {task.users && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <User className="h-3 w-3 mr-1" />
                      {task.users.full_name}
                    </div>
                  )}
                  {task.companies && (
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-gray-500" />
                      <Badge variant="outline" className="text-xs">
                        {task.companies.name}
                      </Badge>
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
  );
};

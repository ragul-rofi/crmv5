"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Target, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { format } from "date-fns";

export const getColumns = (
  onEdit: (task: Task) => void,
  onDelete: (task: Task) => void,
): ColumnDef<Task>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "task_type",
    header: "Type",
    cell: ({ row }) => {
      const taskType = row.getValue("task_type") as string;
      return taskType || "General";
    },
  },
  {
    accessorKey: "assignedToName",
    header: "Assigned To",
    cell: ({ row }) => {
      const task = row.original;
      const assignedTo = task.assignedToName || task.users?.full_name;
      return assignedTo || "Unassigned";
    },
  },
  {
    accessorKey: "assignedByName",
    header: "Assigned By",
    cell: ({ row }) => {
      const task = row.original;
      const assignedBy = task.assignedByName || task.assigned_by_name;
      return assignedBy || "System";
    },
  },
  {
    accessorKey: "targetCount",
    header: "Target",
    cell: ({ row }) => {
      const task = row.original;
      if (task.taskType === "DataCollection" || task.task_type === "DataCollection") {
        const targetCount = task.targetCount || task.target_count;
        return (
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-1" />
            {targetCount ? `${targetCount} companies` : 'Not set'}
          </div>
        );
      }
      return "N/A";
    },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => {
      const task = row.original;
      const date = task.startDate || task.start_date || task.createdAt || task.created_at;
      return date ? (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          {format(new Date(date), "PPP")}
        </div>
      ) : "N/A";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant: "outline" | "secondary" | "default" =
        status === "Completed"
          ? "default"
          : status === "InProgress"
            ? "secondary"
          : "outline";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "deadline",
    header: "Deadline",
    cell: ({ row }) => {
      const deadline = row.getValue("deadline") as string;
      return deadline ? format(new Date(deadline), "PPP") : "N/A";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const task = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(task)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task)}
              className="text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
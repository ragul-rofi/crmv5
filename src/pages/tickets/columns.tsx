"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/types";
import { format } from "date-fns";

export const getColumns = (
  onEdit: (ticket: Ticket) => void,
  onDelete: (ticket: Ticket) => void,
  canManage: boolean,
): ColumnDef<Ticket>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "companyId",
    header: "Company",
    cell: ({ row }) => {
      const companyName = (row.original as any).company_name as string | undefined;
      return companyName || "No Company";
    },
  },
  {
    accessorKey: "assignedToId",
    header: "Assigned To",
    cell: ({ row }) => {
      const assignedToName = (row.original as any).assigned_to_name as string | undefined;
      return assignedToName || "Unassigned";
    },
  },
  {
    accessorKey: "isResolved",
    header: "Status",
    cell: ({ row }) => {
      const isResolved = row.getValue("isResolved") as boolean;
      return (
        <Badge variant={isResolved ? "default" : "secondary"}>
          {isResolved ? "Resolved" : "Open"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at") as string;
      return format(new Date(createdAt), "PPP");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      if (!canManage) return null;
      const ticket = row.original;
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
            <DropdownMenuItem onClick={() => onEdit(ticket)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(ticket)} className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
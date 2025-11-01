import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Company } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableRowActions } from "./DataTableRowActions";

export const getColumns = (
  onEdit: (company: Company) => void,
  onDelete: (company: Company) => void,
  onFinalize?: (company: Company) => void,
  isFinalizedData?: boolean,
): ColumnDef<Company>[] => {
  const columns: ColumnDef<Company>[] = [];

  // Always add checkbox column for multi-selection
  columns.push({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  });

  columns.push(
    {
      accessorKey: "name",
      header: "Company Name",
      cell: ({ row }) => (
        <Link to={`/company/${row.original.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = (row.getValue("email") || "") as string;
        return email ? <a href={`mailto:${email}`} className="text-sm text-sky-600 hover:underline">{email}</a> : "-";
      },
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => {
        const addr = (row.getValue("address") || "") as string;
        if (!addr) return "-";
        return addr.length > 60 ? addr.slice(0, 57) + '...' : addr;
      },
    },
    {
      accessorKey: "conversionStatus",
      header: "Conversion Status",
      cell: ({ row }) => {
        const cs = row.getValue("conversionStatus") as string;
        // Color mapping for conversion status
        const colorMap: Record<string, string> = {
          "Confirmed": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          "Pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          "Follow-up": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          "Not Interested": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        };
        const colorClass = colorMap[cs] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
        return <Badge variant="secondary" className={colorClass}>{cs}</Badge>;
      },
    },
    {
      accessorKey: "finalization_status",
      header: "Finalization",
      cell: ({ row }) => {
        const fs = row.getValue("finalization_status") as string | undefined;
        if (!fs) return "-";
        // Color mapping for finalization status
        const colorMap: Record<string, string> = {
          "Finalized": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
          "Pending": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
          "Draft": "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
        };
        const colorClass = colorMap[fs] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
        return <Badge variant="secondary" className={colorClass}>{fs}</Badge>;
      },
    },
    {
      accessorKey: "data_collector_name",
      header: "Added By",
      cell: ({ row }) => {
        const addedBy = (row.original as any).data_collector_name as string | undefined;
        const assignedCollectorId = (row.original as any).assigned_data_collector_id as string | undefined;
        return addedBy || (assignedCollectorId ? 'Unknown User' : '-');
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DataTableRowActions
          onEdit={() => onEdit(row.original)}
          onDelete={() => onDelete(row.original)}
          onFinalize={onFinalize ? () => onFinalize(row.original) : undefined}
          showFinalize={row.original.conversionStatus === 'Confirmed' && row.original.finalization_status !== 'Finalized'}
          isFinalizedData={isFinalizedData}
        />
      ),
    }
  );

  return columns;
};
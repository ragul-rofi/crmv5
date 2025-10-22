import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Company } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableRowActions } from "./DataTableRowActions";

export const getColumns = (
  onEdit: (company: Company) => void,
  onDelete: (company: Company) => void,
  enableSelection: boolean = false,
  onFinalize?: (company: Company) => void,
): ColumnDef<Company>[] => {
  const columns: ColumnDef<Company>[] = [];

  // Add checkbox column if selection is enabled
  if (enableSelection) {
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
  }

  columns.push(
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        return (
          <Link to={`/company/${row.original.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            {row.getValue("name")}
          </Link>
        );
      },
    },
    {
      accessorKey: "industry",
      header: "Industry",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge variant={status === "Active" ? "default" : "secondary"}>{status}</Badge>;
      },
    },
    {
      accessorKey: "conversionStatus",
      header: "Conversion Status",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions
          onEdit={() => onEdit(row.original)}
          onDelete={() => onDelete(row.original)}
          onFinalize={onFinalize ? () => onFinalize(row.original) : undefined}
          showFinalize={row.original.conversionStatus === 'Confirmed' && row.original.finalization_status !== 'Finalized'}
        />
      ),
    }
  );

  return columns;
};
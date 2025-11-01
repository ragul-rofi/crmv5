import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export const getFinalizedColumns = (
  onDrop: (company: any) => void,
  canEditFinalized: boolean,
): ColumnDef<any>[] => {
  const columns: ColumnDef<any>[] = [];

  // Checkbox column for selection
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
        <Link 
          to={`/company/${row.original.id}`} 
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return email ? (
          <a href={`mailto:${email}`} className="text-primary hover:underline">
            {email}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ row }) => {
        const industry = row.getValue("industry") as string;
        return industry || <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: "conversionStatus",
      header: "Conversion Status",
      cell: ({ row }) => {
        const status = row.getValue("conversionStatus") as string;
        const colorMap: Record<string, string> = {
          "Confirmed": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          "Negotiating": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          "Waiting": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          "NoReach": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        };
        const colorClass = colorMap[status] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
        return <Badge variant="secondary" className={colorClass}>{status}</Badge>;
      },
    },
    {
      accessorKey: "finalized_by_name",
      header: "Finalized By",
      cell: ({ row }) => {
        const name = row.getValue("finalized_by_name") as string;
        return name || <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: "finalized_at",
      header: "Finalized Date",
      cell: ({ row }) => {
        const date = row.getValue("finalized_at") as string;
        return date ? new Date(date).toLocaleDateString() : <span className="text-muted-foreground">-</span>;
      },
    }
  );

  // Add actions column only if user can edit finalized data
  if (canEditFinalized) {
    columns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDrop(row.original)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Drop
        </Button>
      ),
    });
  }

  return columns;
};

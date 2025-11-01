import { MoreHorizontal, Pencil, Trash, Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/usePermissions";

interface DataTableRowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onFinalize?: () => void;
  showFinalize?: boolean;
  isFinalizedData?: boolean; // Add isFinalizedData prop
}

export function DataTableRowActions({
  onEdit,
  onDelete,
  onFinalize,
  showFinalize = false,
  isFinalizedData = false, // Default to false
}: DataTableRowActionsProps) {
  const { canEdit, canDelete, canFinalize, canRead } = usePermissions();

  // Don't render if user has no permissions at all
  if (!canRead && !canEdit && !canDelete && !canFinalize) {
    return null;
  }

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
        <DropdownMenuSeparator />
        {isFinalizedData ? (
          // For finalized data, only show view details
          <DropdownMenuItem onClick={onEdit}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        ) : (
          <>
            {/* Always show view/edit option for users who can read */}
            <DropdownMenuItem onClick={onEdit}>
              {canEdit ? (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </>
              )}
            </DropdownMenuItem>
            
            {showFinalize && onFinalize && canFinalize && (
              <DropdownMenuItem onClick={onFinalize} className="text-green-600">
                <CheckCircle className="mr-2 h-4 w-4" />
                Finalize
              </DropdownMenuItem>
            )}
            
            {canDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { PaginationState } from "@tanstack/react-table";
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
import { getFinalizedColumns } from "./finalized/columns";



const FinalizedDataPage = () => {
  const queryClient = useQueryClient();
  const { role, canExportFinalized, canEditFinalized } = usePermissions();
  const [pagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });
  const [companyToDrop, setCompanyToDrop] = useState<any>(null);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);
  // Protect the route - only authenticated users with workflow roles
  if (!role) {
    return <Navigate to="/" replace />;
  }

  const { data: finalizedData, isLoading, isError } = useQuery({
    queryKey: ["companies", "finalized", pagination.pageIndex, pagination.pageSize],
    queryFn: () => api.getFinalizedCompanies(pagination.pageIndex + 1, pagination.pageSize),
  });

  // Drop mutation to remove finalization status
  const dropMutation = useMutation({
    mutationFn: async (companyId: string) => {
      // We'll need to create an API method to unfinalze/drop a company
      return api.unfinalizeCompany(companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", "finalized"] });
      toast.success("Company dropped from finalized status successfully");
      setIsDropDialogOpen(false);
      setCompanyToDrop(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to drop company");
    },
  });

  const rows: Array<{ id: string; name: string; email: string | null; conversionStatus: string; finalization_status?: string }> = Array.isArray(finalizedData?.data) ? finalizedData!.data : [];
  const paginationInfo = {
    page: finalizedData?.pagination?.page || 1,
    pages: finalizedData?.pagination?.pages || 1,
    total: finalizedData?.pagination?.total || 0,
  };

  const handleDropCompany = (company: any) => {
    setCompanyToDrop(company);
    setIsDropDialogOpen(true);
  };

  const confirmDrop = () => {
    if (companyToDrop) {
      dropMutation.mutate(companyToDrop.id);
    }
  };

  const handleExportFinalized = async () => {
    try {
      // Create a temporary link to trigger the download
      const response = await fetch(`/api/v1/export/companies/finalized`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finalized_companies_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export completed successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Export failed. Please try again.');
    }
  };

  const columns = useMemo(
    () => getFinalizedColumns(handleDropCompany, canEditFinalized),
    [canEditFinalized]
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading finalized companies...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading finalized companies</p>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Finalized Companies</h1>
          <p className="text-muted-foreground mt-1">
            View all companies that have been finalized and are ready for review
          </p>
        </div>
        {canExportFinalized && (
          <Button onClick={handleExportFinalized} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Export to Excel
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={rows}
        filterColumnId="name"
        filterPlaceholder="Filter by company name..."
        enableRowSelection={false}
        pagination={pagination}
        pageCount={paginationInfo.pages}
        totalCount={paginationInfo.total}
      />

      {/* Drop Confirmation Dialog */}
      <AlertDialog open={isDropDialogOpen} onOpenChange={setIsDropDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drop Company from Finalized Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to drop "{companyToDrop?.name}" from finalized status? 
              This will move the company back to the regular data pool and it will need to be finalized again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDrop}
              className="bg-red-600 hover:bg-red-700"
              disabled={dropMutation.isPending}
            >
              {dropMutation.isPending ? "Dropping..." : "Drop Company"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FinalizedDataPage;
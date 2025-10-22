import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Company, CustomFieldDefinition } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { getColumns } from "./data/columns";
import CompanyForm from "./data/CompanyForm";
import { ImportCompaniesModal } from "./data/ImportCompaniesModal";
import { PlusCircle, Upload } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

const fetchCompanies = async () => {
  return api.getCompanies();
};

const fetchCustomFieldDefs = async () => {
  return api.getCustomFields();
};

const DataPage = () => {
  const queryClient = useQueryClient();
  const { canCreate, canEdit, canDelete, canFinalize } = usePermissions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const { data: companies, isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });

  const { data: customFieldDefs, isLoading: isLoadingCustomFields } = useQuery<CustomFieldDefinition[]>({
    queryKey: ["customFieldDefinitions"],
    queryFn: fetchCustomFieldDefs,
  });

  const mutation = useMutation({
    mutationFn: async (
      newCompany: Omit<Company, "id" | "created_at"> & { id?: string },
    ) => {
      const { id, ...companyData } = newCompany;
      if (id) {
        return api.updateCompany(id, companyData);
      } else {
        return api.createCompany(companyData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success(
        `Company ${selectedCompany ? "updated" : "added"} successfully.`,
      );
      setIsDialogOpen(false);
      setSelectedCompany(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (companyId: string) => {
      return api.deleteCompany(companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted successfully.");
      setIsAlertOpen(false);
      setSelectedCompany(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (companyIds: string[]) => {
      // Delete companies one by one
      await Promise.all(companyIds.map(id => api.deleteCompany(id)));
      return companyIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success(`${count} companies deleted successfully.`);
    },
    onError: (error: Error) => {
      toast.error(`Bulk delete failed: ${error.message}`);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async (companyId: string) => {
      return api.finalizeCompany(companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company data finalized successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAddNew = () => {
    setSelectedCompany(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsDialogOpen(true);
  };

  const handleDelete = (company: Company) => {
    setSelectedCompany(company);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCompany) {
      deleteMutation.mutate(selectedCompany.id);
    }
  };

  const handleSave = (companyData: Omit<Company, "id" | "created_at">) => {
    mutation.mutate({ ...companyData, id: selectedCompany?.id });
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedIds.length} companies? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleFinalize = (company: Company) => {
    if (company.conversionStatus !== 'Confirmed') {
      toast.error('Can only finalize confirmed companies');
      return;
    }
    
    if (confirm(`Finalize data for "${company.name}"? This will make it read-only and forward to Head/SubHead.`)) {
      finalizeMutation.mutate(company.id);
    }
  };

  const columns = useMemo(
    () => getColumns(handleEdit, handleDelete, canEdit, canFinalize ? handleFinalize : undefined),
    [canEdit, canFinalize],
  );

  const isLoading = isLoadingCompanies || isLoadingCustomFields;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Company Data</h1>
        {canCreate && (
          <div className="flex space-x-2">
            <Button onClick={() => setImportModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Company
            </Button>
          </div>
        )}
      </div>
      <DataTable
        columns={columns}
        data={companies || []}
        filterColumnId="name"
        filterPlaceholder="Filter by company name..."
        enableRowSelection={canDelete}
        onBulkDelete={canDelete ? handleBulkDelete : undefined}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? "Edit Company" : "Add New Company"}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany
                ? "Update the details of the company."
                : "Enter the details for the new company."}
            </DialogDescription>
          </DialogHeader>
          <CompanyForm
            company={selectedCompany}
            customFieldDefs={customFieldDefs || []}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
            isSaving={mutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              company &quot;{selectedCompany?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        
      <ImportCompaniesModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} />
    </div>
  );
};

export default DataPage;

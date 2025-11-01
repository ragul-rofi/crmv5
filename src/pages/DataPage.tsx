import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Company } from "@/types";
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
import CompanyForm from "./data/CompanyFormFixed";
import { ImportCompaniesModal } from "./data/ImportCompaniesModal";
import { PlusCircle, FileUp, Download } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { PaginationState } from "@tanstack/react-table";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileTable, MobileCompanyCard } from "@/components/ui/mobile-table";

const fetchCompanies = async (page: number = 1, limit: number = 50) => {
  return api.getCompanies(page, limit);
};

// const fetchMyCompanies = async (page: number = 1, limit: number = 50) => {
//   return api.getMyCompanies(page, limit);
// };

// Custom fields no longer used in the new company form

const DataPage = () => {
  const queryClient = useQueryClient();
  const { canCreate, canFinalize, canExportFinalized, canBulkDelete, role } = usePermissions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyToFinalize, setCompanyToFinalize] = useState<Company | null>(null);
  const [existingContacts, setExistingContacts] = useState<any[]>([]);
  
  // Pagination states
  const [allCompaniesPagination, setAllCompaniesPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  // Only fetch my companies if user is a Converter

  const { data: allCompaniesData, isLoading: isLoadingAllCompanies } = useQuery({
    queryKey: ["companies", "all", allCompaniesPagination.pageIndex, allCompaniesPagination.pageSize],
    queryFn: () => fetchCompanies(allCompaniesPagination.pageIndex + 1, allCompaniesPagination.pageSize),
  });

  console.log('allCompaniesData:', allCompaniesData);

  // Only fetch my companies if user is a Converter
  // const { data: myCompaniesData, isLoading: isLoadingMyCompanies } = useQuery({
  //   queryKey: ["companies", "my", allCompaniesPagination.pageIndex, allCompaniesPagination.pageSize],
  //   queryFn: () => fetchMyCompanies(allCompaniesPagination.pageIndex + 1, allCompaniesPagination.pageSize),
  //   enabled: role === 'Converter',
  // });

  // const { data: customFieldDefs, isLoading: isLoadingCustomFields } = useQuery<CustomFieldDefinition[]>({
  //   queryKey: ["customFieldDefinitions"],
  //   queryFn: fetchCustomFieldDefs,
  // });

  // Extract data and pagination info
  const allCompanies = allCompaniesData?.data || [];
  const allCompaniesPaginationInfo = {
    page: allCompaniesData?.pagination?.page || 1,
    pages: allCompaniesData?.pagination?.pages || 1,
    total: allCompaniesData?.pagination?.total || 0,
  };
  
  // Only show my companies data if user is a Converter
  // const myCompanies = myCompaniesData?.data || [];
  // const myCompaniesPaginationInfo = {
  //   page: myCompaniesData?.pagination?.page || 1,
  //   pages: myCompaniesData?.pagination?.pages || 1,
  //   total: myCompaniesData?.pagination?.total || 0,
  // };

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
      // Invalidate all company-related queries by matching the prefix
      queryClient.invalidateQueries({ queryKey: ["companies"], exact: false });
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
      // Invalidate all company-related queries by matching the prefix
      queryClient.invalidateQueries({ queryKey: ["companies"], exact: false });
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
      // Invalidate all company-related queries by matching the prefix
      queryClient.invalidateQueries({ queryKey: ["companies"], exact: false });
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
      // Invalidate all company-related queries by matching the prefix
      queryClient.invalidateQueries({ queryKey: ["companies"], exact: false });
      toast.success("Company data finalized successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAddNew = () => {
    setSelectedCompany(null);
    setExistingContacts([]);
    setIsDialogOpen(true);
  };

  const handleEdit = useCallback(async (company: Company) => {
    setSelectedCompany(company);
    // Fetch existing contacts for this company
    try {
      const contacts = await api.getContactsForCompany(company.id);
      setExistingContacts(contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setExistingContacts([]);
    }
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback((company: Company) => {
    setSelectedCompany(company);
    setIsAlertOpen(true);
  }, []);

  const confirmDelete = () => {
    if (selectedCompany) {
      deleteMutation.mutate(selectedCompany.id);
    }
  };

  const handleSave = async (
    companyData: Omit<Company, "id" | "created_at">,
    contactPersons?: { id?: string; name: string; mobile: string; email: string }[]
  ) => {
    try {
      console.log('Saving company data:', companyData);
      
      // Create or update the company first
      let saved: Company;
      if (selectedCompany?.id) {
        saved = await api.updateCompany(selectedCompany.id, companyData);
      } else {
        saved = await api.createCompany(companyData);
      }

      // Create contact persons if provided and company was created/updated successfully
      if (contactPersons && contactPersons.length > 0) {
        const createPromises = contactPersons
          .filter(cp => cp.name?.trim())
          .map(cp => api.createContact({
            name: cp.name,
            email: cp.email || null,
            phone: cp.mobile || null,
            companyId: saved.id,
          }));
        await Promise.all(createPromises);
      }

      // Invalidate queries and close modal
      queryClient.invalidateQueries({ queryKey: ["companies"], exact: false });
      toast.success(`Company ${selectedCompany ? "updated" : "added"} successfully.`);
      setIsDialogOpen(false);
      setSelectedCompany(null);
    } catch (error: any) {
      console.error('Error saving company:', error);
      // Extract validation errors if present
      const errorMessage = error?.message || 'Failed to save company';
      const validationErrors = error?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        const errorDetails = validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        toast.error(`${errorMessage}: ${errorDetails}`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedIds.length} companies? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleFinalize = useCallback((company: Company) => {
    if (company.conversionStatus !== 'Confirmed') {
      toast.error('Can only finalize confirmed companies');
      return;
    }
    
    setCompanyToFinalize(company);
    setIsFinalizeDialogOpen(true);
  }, []);

  const confirmFinalize = () => {
    if (companyToFinalize) {
      finalizeMutation.mutate(companyToFinalize.id);
      setIsFinalizeDialogOpen(false);
      setCompanyToFinalize(null);
    }
  };

  const handleExportFinalized = async () => {
    try {
      // Create a temporary link to trigger the download
      // Use the correct export endpoint
      const response = await fetch('/api/v1/export/companies/finalized', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'finalized_companies.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  const columns = useMemo(
    () => getColumns(handleEdit, handleDelete, canFinalize ? handleFinalize : undefined),
    [handleEdit, handleDelete, handleFinalize, canFinalize],
  );

  const isLoading = isLoadingAllCompanies;

  if (isLoading) return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Company Data</h1>
          <p className="text-muted-foreground mt-1">Manage and track your company information</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {(role === 'Head' || role === 'SubHead') && canExportFinalized && (
            <Button onClick={handleExportFinalized} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          )}
          {canCreate && (
            <>
              <Button onClick={() => setImportModalOpen(true)} className="w-full sm:w-auto">
                <FileUp className="mr-2 h-4 w-4" /> Import
              </Button>
              <Button onClick={handleAddNew} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Company
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={allCompanies || []}
          filterColumnId="name"
          filterPlaceholder="Filter by company name..."
          enableRowSelection={true}
          onBulkDelete={canBulkDelete ? handleBulkDelete : undefined}
          pagination={{
            pageIndex: allCompaniesPagination.pageIndex,
            pageSize: allCompaniesPagination.pageSize,
          }}
          onPaginationChange={setAllCompaniesPagination}
          pageCount={allCompaniesPaginationInfo.pages}
          totalCount={allCompaniesPaginationInfo.total}
        />
      </div>
      <MobileTable
        data={allCompanies || []}
        renderItem={(company) => (
          <MobileCompanyCard
            key={company.id}
            company={company}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        emptyMessage="No companies found"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-y-auto" aria-describedby="company-dialog-description">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? "Edit Company" : "Add New Company"}
            </DialogTitle>
            <DialogDescription id="company-dialog-description">
              {selectedCompany
                ? "Update the details of the company."
                : "Enter the details for the new company."}
            </DialogDescription>
          </DialogHeader>
          <CompanyForm
            company={selectedCompany}
            existingContacts={existingContacts}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
            isSaving={mutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent aria-describedby="delete-company-alert-description">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription id="delete-company-alert-description">
              This action cannot be undone. This will permanently delete the
              company "{selectedCompany?.name}".
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

      <AlertDialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
        <AlertDialogContent aria-describedby="finalize-company-alert-description">
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize Company Data</AlertDialogTitle>
            <AlertDialogDescription id="finalize-company-alert-description">
              Finalize data for "{companyToFinalize?.name}"? This will make it read-only and forward to Head/SubHead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFinalize} className="bg-green-600 hover:bg-green-700">
              Finalize
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        
      <ImportCompaniesModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} />
    </div>
  );
};

export default DataPage;
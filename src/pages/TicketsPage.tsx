import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Ticket, Company, User } from "@/types";
import { useUser } from "@/contexts/UserContext";
import { usePermissions } from "@/hooks/usePermissions";
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
import { getColumns } from "./tickets/columns";
import TicketForm from "./tickets/TicketForm";
import { PaginationState } from "@tanstack/react-table";

const fetchTickets = async (page: number = 1, limit: number = 50) => {
  return api.getTickets(page, limit);
};

const fetchCompanies = async (page: number = 1, limit: number = 1000) => {
  return api.getCompanies(page, limit);
};

const fetchUsers = async () => {
  return api.getUsersList();
};

const TicketsPage = () => {
  const queryClient = useQueryClient();
  const { userProfile } = useUser();
  const { canDelete } = usePermissions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery({
    queryKey: ["tickets", pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchTickets(pagination.pageIndex + 1, pagination.pageSize),
  });
  
  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: () => fetchCompanies(1, 1000),
  });
  
  // Extract companies array from paginated response
  const companies = companiesData?.data || [];
  
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
  
  // Extract data and pagination info
  const tickets = ticketsData?.data || [];
  const paginationInfo = {
    page: ticketsData?.pagination?.page || 1,
    pages: ticketsData?.pagination?.pages || 1,
    total: ticketsData?.pagination?.total || 0,
  };

  const mutation = useMutation({
    mutationFn: async (
      newTicket: Omit<Ticket, "id" | "created_at" | "companies" | "raisedBy" | "assignedTo"> & { id?: string },
    ) => {
      const { id, ...ticketData } = newTicket;

      if (id) {
        return api.updateTicket(id, ticketData);
      } else {
        return api.createTicket({ ...ticketData, raisedById: userProfile!.id });
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success(`Ticket ${selectedTicket ? "updated" : "added"} successfully.`);
      setIsDialogOpen(false);
      setSelectedTicket(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return api.deleteTicket(ticketId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket deleted successfully.");
      setIsAlertOpen(false);
      setSelectedTicket(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddNew = () => {
    setSelectedTicket(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDialogOpen(true);
  };

  const handleDelete = (ticket: Ticket) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete tickets');
      return;
    }
    setSelectedTicket(ticket);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTicket) {
      deleteMutation.mutate(selectedTicket.id);
    }
  };

  const handleSave = (ticketData: Omit<Ticket, "id" | "created_at" | "raisedById" | "companies" | "raisedBy" | "assignedTo">) => {
    if (selectedTicket) {
      // When editing, preserve the raisedById from the existing ticket
      mutation.mutate({ ...ticketData, raisedById: selectedTicket.raisedById, id: selectedTicket.id });
    } else {
      // When creating, use current user's ID as raisedById
      mutation.mutate({ ...ticketData, raisedById: userProfile!.id });
    }
  };

  const columns = useMemo(() => getColumns(handleEdit, handleDelete, canDelete), [canDelete]);

  const isLoading = isLoadingTickets || isLoadingCompanies || isLoadingUsers;

  return (
    <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Tickets</h1>
            <p className="text-muted-foreground mt-1">Manage support tickets and requests</p>
          </div>
          <Button onClick={handleAddNew} className="btn-primary">Add Ticket</Button>
        </div>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            data={tickets || []}
            filterColumnId="title"
            filterPlaceholder="Filter by ticket title..."
            pagination={{
              pageIndex: pagination.pageIndex,
              pageSize: pagination.pageSize,
            }}
            onPaginationChange={setPagination}
            pageCount={paginationInfo.pages}
            totalCount={paginationInfo.total}
          />
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" aria-describedby="ticket-dialog-description">
            <DialogHeader>
              <DialogTitle>
                {selectedTicket ? "Edit Ticket" : "Add New Ticket"}
              </DialogTitle>
              <DialogDescription id="ticket-dialog-description">
                {selectedTicket
                  ? "Update the details of the ticket."
                  : "Enter the details for the new ticket."}
              </DialogDescription>
            </DialogHeader>
            <TicketForm
              ticket={selectedTicket}
              companies={companies || []}
              users={users || []}
              onSave={handleSave}
              onCancel={() => setIsDialogOpen(false)}
              isSaving={mutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent aria-describedby="delete-ticket-alert-description">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription id="delete-ticket-alert-description">
                This action cannot be undone. This will permanently delete the
                ticket &quot;{selectedTicket?.title}&quot;.
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
      </div>
  );
};

export default TicketsPage;
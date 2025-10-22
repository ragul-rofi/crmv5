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

const fetchTickets = async () => {
  return api.getTickets();
};

const fetchCompanies = async () => {
  return api.getCompanies();
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

  const { data: tickets, isLoading: isLoadingTickets } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
  });
  const { data: companies, isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

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
    <div className="p-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tickets</h1>
          <Button onClick={handleAddNew}>Add Ticket</Button>
        </div>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            data={tickets || []}
            filterColumnId="title"
            filterPlaceholder="Filter by ticket title..."
          />
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedTicket ? "Edit Ticket" : "Add New Ticket"}
              </DialogTitle>
              <DialogDescription>
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
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

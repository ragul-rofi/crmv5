import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Ticket, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/layout/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CompanyTicketsProps {
  tickets: Ticket[];
  companyId: string;
}

export const CompanyTickets = ({ tickets, companyId }: CompanyTicketsProps) => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(1, 100),
  });

  const users: User[] = usersData?.data || [];

  const createTicketMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      companyId: string;
      assignedToId: string;
    }) => {
      return await api.createTicket(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      toast.success("Ticket created successfully");
      setIsAddDialogOpen(false);
      setTicketTitle("");
      setTicketDescription("");
      setAssignedToId("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create ticket");
    },
  });

  const handleAdd = () => {
    setTicketTitle("");
    setTicketDescription("");
    setAssignedToId("");
    setIsAddDialogOpen(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticketTitle.trim()) {
      toast.error("Ticket title is required");
      return;
    }

    if (!assignedToId) {
      toast.error("Please assign the ticket to someone");
      return;
    }

    createTicketMutation.mutate({
      title: ticketTitle,
      description: ticketDescription,
      companyId: companyId,
      assignedToId: assignedToId,
    });
  };
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Tickets</CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Ticket
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Title</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Created At</TableHead>
              <TableHead className="whitespace-nowrap">Assigned To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium whitespace-nowrap">{ticket.title}</TableCell>
                  <TableCell>
                    <Badge variant={ticket.isResolved ? "default" : "destructive"}>{ticket.isResolved ? "Resolved" : "Open"}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{format(new Date(ticket.created_at), "PPP")}</TableCell>
                  <TableCell className="whitespace-nowrap">{ticket.assignedTo?.full_name || "Unassigned"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No tickets found for this company.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    {/* Add Ticket Dialog */}
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="add-ticket-dialog-description">
        <DialogHeader>
          <DialogTitle>Add New Ticket</DialogTitle>
          <DialogDescription id="add-ticket-dialog-description">
            Create a new ticket for this company.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmitAdd} className="space-y-4">
          <div>
            <Label htmlFor="ticket-title">Title *</Label>
            <Input
              id="ticket-title"
              value={ticketTitle}
              onChange={(e) => setTicketTitle(e.target.value)}
              placeholder="Enter ticket title"
              required
            />
          </div>
          <div>
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
              placeholder="Enter ticket description..."
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="assigned-to">Assign To *</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId} required>
              <SelectTrigger id="assigned-to">
                <SelectValue placeholder="Select user to assign" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTicketMutation.isPending}>
              {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </>
  );
};
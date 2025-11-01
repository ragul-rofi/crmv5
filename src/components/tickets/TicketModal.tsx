import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Company } from "@/types";
import { useUser } from "@/contexts/UserContext";
import { getAssignableUsers } from "@/utils/hierarchicalAssignment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
}

export const TicketModal = ({ isOpen, onClose, company }: TicketModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const queryClient = useQueryClient();
  const { userProfile } = useUser();

  const { data: users } = useQuery({
    queryKey: ["users", "list"],
    queryFn: () => api.getUsersList(),
  });

  const assignableUsers = users && userProfile 
    ? getAssignableUsers(users, userProfile.role as any)
    : [];

  const createTicketMutation = useMutation({
    mutationFn: (data: { title: string; description: string; companyId: string; assignedToId?: string }) =>
      api.createTicket(data),
    onSuccess: () => {
      toast.success("Ticket created successfully");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      onClose();
      setTitle("");
      setDescription("");
      setAssignedToId("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create ticket");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !title.trim() || !description.trim()) return;

    createTicketMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      companyId: company.id,
      assignedToId: assignedToId || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raise Ticket for {company?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company?.name || ""}
              readOnly
              disabled
              className="bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter ticket title"
              required
            />
          </div>
          <div>
            <Label htmlFor="assignedTo">Assign To</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger>
                <SelectValue placeholder="Select user to assign" />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue or request"
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTicketMutation.isPending || !title.trim() || !description.trim()}
            >
              {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
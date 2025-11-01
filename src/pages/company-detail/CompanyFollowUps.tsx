import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/layout/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useUser } from "@/contexts/UserContext";
import { api } from "@/lib/api";
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

interface FollowUp {
  id: string;
  company_id: string;
  contacted_date: string | null;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  contacted_by_id: string;
  contacted_by_name?: string;
  created_at: string;
}

interface CompanyFollowUpsProps {
  companyId: string;
  followUps: FollowUp[];
}

export const CompanyFollowUps = ({ companyId, followUps }: CompanyFollowUpsProps) => {
  const { userProfile } = useUser();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contactedDate, setContactedDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFollowUpId, setSelectedFollowUpId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const createFollowUpMutation = useMutation({
    mutationFn: async (data: {
      company_id: string;
      contacted_date: string;
      follow_up_date: string;
      follow_up_notes: string;
    }) => {
      return await api.createFollowUp(data);
    },
    onSuccess: async () => {
      // Invalidate and refetch the company data
      await queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      await queryClient.refetchQueries({ queryKey: ["company", companyId] });
      
      toast.success("Follow-up added successfully");
      setIsDialogOpen(false);
      setContactedDate("");
      setFollowUpDate("");
      setFollowUpNotes("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add follow-up");
    },
  });

  const requestDeleteMutation = useMutation({
    mutationFn: async (data: { followup_id: string; reason?: string }) => {
      return await api.createFollowUpDeletionRequest(data);
    },
    onSuccess: async () => {
      toast.success("Deletion request sent to manager for approval");
      setDeleteDialogOpen(false);
      setSelectedFollowUpId(null);
      setDeleteReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to request deletion");
    },
  });

  const directDeleteMutation = useMutation({
    mutationFn: async (followUpId: string) => {
      return await api.deleteFollowUp(followUpId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      await queryClient.refetchQueries({ queryKey: ["company", companyId] });
      
      toast.success("Follow-up deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedFollowUpId(null);
      setDeleteReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete follow-up");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactedDate || !followUpDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate that follow-up date is greater than contacted date
    const contacted = new Date(contactedDate);
    const followUp = new Date(followUpDate);
    
    if (followUp <= contacted) {
      toast.error("Follow-up date must be greater than the contacted date");
      return;
    }

    createFollowUpMutation.mutate({
      company_id: companyId,
      contacted_date: contactedDate,
      follow_up_date: followUpDate,
      follow_up_notes: followUpNotes,
    });
  };

  const handleDeleteRequest = (followUpId: string) => {
    setSelectedFollowUpId(followUpId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRequest = () => {
    if (!selectedFollowUpId) return;

    const isAdmin = userProfile?.role === "Admin";

    if (isAdmin) {
      // Admin can delete directly without approval
      directDeleteMutation.mutate(selectedFollowUpId);
    } else {
      // Non-admin users need to provide a reason and request approval
      if (!deleteReason || deleteReason.trim().length < 10) {
        toast.error("Please provide a reason (at least 10 characters)");
        return;
      }

      requestDeleteMutation.mutate({
        followup_id: selectedFollowUpId,
        reason: deleteReason,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Follow-up History</CardTitle>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Follow-up
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Contacted Date</TableHead>
                <TableHead className="whitespace-nowrap">Follow-up Date</TableHead>
                <TableHead className="whitespace-nowrap">Notes</TableHead>
                <TableHead className="whitespace-nowrap">Contacted By</TableHead>
                <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followUps && followUps.length > 0 ? (
                followUps.map((followUp) => (
                  <TableRow key={followUp.id}>
                    <TableCell className="whitespace-nowrap">
                      {followUp.contacted_date ? format(new Date(followUp.contacted_date), "PPP") : "N/A"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {followUp.follow_up_date ? format(new Date(followUp.follow_up_date), "PPP") : "N/A"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {followUp.follow_up_notes || "No notes"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {followUp.contacted_by_name || userProfile?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(followUp.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No follow-ups yet. Create one to start tracking.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="follow-up-dialog-description">
          <DialogHeader>
            <DialogTitle>Add New Follow-up</DialogTitle>
            <DialogDescription id="follow-up-dialog-description">
              Record a follow-up activity for this company.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="contacted-date">Contacted Date *</Label>
              <Input
                id="contacted-date"
                type="date"
                value={contactedDate}
                onChange={(e) => setContactedDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="follow-up-date">Follow-up Date *</Label>
              <Input
                id="follow-up-date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                min={contactedDate || undefined}
                required
              />
              {contactedDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Follow-up date must be after the contacted date
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="follow-up-notes">Follow-up Notes</Label>
              <Textarea
                id="follow-up-notes"
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="Enter notes about this follow-up..."
                rows={4}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Contacted By: {userProfile?.full_name} (auto-filled)
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createFollowUpMutation.isPending}>
                {createFollowUpMutation.isPending ? "Adding..." : "Add Follow-up"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userProfile?.role === "Admin" ? "Delete Follow-up" : "Request Follow-up Deletion"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userProfile?.role === "Admin" 
                ? "Are you sure you want to delete this follow-up? This action cannot be undone."
                : "This will send a deletion request to your manager for approval. Please provide a reason for deleting this follow-up."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          {userProfile?.role !== "Admin" && (
            <div className="py-4">
              <Label htmlFor="delete-reason">Reason for Deletion *</Label>
              <Textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Explain why this follow-up should be deleted (minimum 10 characters)..."
                rows={4}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {deleteReason.length}/10 characters minimum
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedFollowUpId(null);
              setDeleteReason("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRequest}
              disabled={
                (userProfile?.role === "Admin" ? directDeleteMutation.isPending : requestDeleteMutation.isPending) ||
                (userProfile?.role !== "Admin" && deleteReason.trim().length < 10)
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              {userProfile?.role === "Admin" 
                ? (directDeleteMutation.isPending ? "Deleting..." : "Delete")
                : (requestDeleteMutation.isPending ? "Sending..." : "Send Request")
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

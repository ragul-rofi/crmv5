import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { FollowUpDeletionRequest } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const FollowUpDeletionRequestsPage = () => {
  const queryClient = useQueryClient();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FollowUpDeletionRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  const { data: requests, isLoading } = useQuery({
    queryKey: ["followup-deletion-requests"],
    queryFn: async () => {
      return await api.getFollowUpDeletionRequests();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) => {
      return await api.reviewFollowUpDeletionRequest(id, action, reason);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["followup-deletion-requests"] });
      toast.success(
        variables.action === 'approve' 
          ? "Deletion request approved successfully" 
          : "Deletion request rejected"
      );
      setReviewDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to review deletion request");
    },
  });

  const handleReview = (request: FollowUpDeletionRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const confirmReview = () => {
    if (!selectedRequest) return;

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    reviewMutation.mutate({
      id: selectedRequest.id,
      action: reviewAction,
      reason: reviewAction === 'reject' ? rejectionReason : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingRequests = requests?.filter((r: FollowUpDeletionRequest) => r.status === 'pending') || [];
  const reviewedRequests = requests?.filter((r: FollowUpDeletionRequest) => r.status !== 'pending') || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading deletion requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Follow-up Deletion Requests</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve or reject follow-up deletion requests from your team
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({reviewedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No pending deletion requests
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request: FollowUpDeletionRequest) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {request.company_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Requested by {request.requested_by_name} ({request.requested_by_role})
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Contacted Date:</span>{" "}
                      {request.contacted_date ? format(new Date(request.contacted_date), "PPP") : "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Follow-up Date:</span>{" "}
                      {request.follow_up_date ? format(new Date(request.follow_up_date), "PPP") : "N/A"}
                    </div>
                  </div>
                  
                  {request.follow_up_notes && (
                    <div className="text-sm">
                      <span className="font-medium">Follow-up Notes:</span>
                      <p className="mt-1 text-muted-foreground">{request.follow_up_notes}</p>
                    </div>
                  )}

                  {request.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Deletion Reason:</span>
                      <p className="mt-1 text-muted-foreground">{request.reason}</p>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Requested on {format(new Date(request.created_at), "PPP 'at' p")}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleReview(request, 'approve')}
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview(request, 'reject')}
                      variant="destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4 mt-6">
          {reviewedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No reviewed requests yet
              </CardContent>
            </Card>
          ) : (
            reviewedRequests.map((request: FollowUpDeletionRequest) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {request.company_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Requested by {request.requested_by_name} ({request.requested_by_role})
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Contacted Date:</span>{" "}
                      {request.contacted_date ? format(new Date(request.contacted_date), "PPP") : "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Follow-up Date:</span>{" "}
                      {request.follow_up_date ? format(new Date(request.follow_up_date), "PPP") : "N/A"}
                    </div>
                  </div>

                  {request.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Deletion Reason:</span>
                      <p className="mt-1 text-muted-foreground">{request.reason}</p>
                    </div>
                  )}

                  {request.rejection_reason && (
                    <div className="text-sm">
                      <span className="font-medium">Rejection Reason:</span>
                      <p className="mt-1 text-destructive">{request.rejection_reason}</p>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Reviewed by {request.reviewed_by_name} on{" "}
                    {request.reviewed_at ? format(new Date(request.reviewed_at), "PPP 'at' p") : "N/A"}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Deletion Request
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' 
                ? 'Are you sure you want to approve this deletion request? The follow-up will be permanently deleted.'
                : 'Please provide a reason for rejecting this deletion request.'}
            </DialogDescription>
          </DialogHeader>

          {reviewAction === 'reject' && (
            <div className="py-4">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={4}
                className="mt-2"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialogOpen(false);
                setSelectedRequest(null);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReview}
              disabled={reviewMutation.isPending || (reviewAction === 'reject' && !rejectionReason.trim())}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {reviewMutation.isPending ? 'Processing...' : reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

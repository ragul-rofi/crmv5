import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Company, Ticket, User } from "@/types";
import { useEffect, useState } from "react";

type TicketFormData = Omit<Ticket, "id" | "created_at" | "raisedById" | "companies" | "raisedBy" | "assignedTo">;

interface TicketFormProps {
  ticket: Ticket | null;
  companies: Company[];
  users: User[];
  onSave: (ticket: TicketFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
  preselectedCompany?: Company;
}

const TicketForm = ({
  ticket,
  companies,
  users,
  onSave,
  onCancel,
  isSaving,
  preselectedCompany,
}: TicketFormProps) => {
  const [formData, setFormData] = useState<TicketFormData>({
    title: "",
    description: "",
    status: "Open",
    isResolved: false,
    resolved_at: null,
    companyId: "",
    assignedToId: "",
  });

  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || "",
        description: ticket.description || "",
        status: ticket.status || "Open",
        isResolved: ticket.isResolved || false,
        resolved_at: ticket.resolved_at,
        companyId: ticket.companyId || "",
        assignedToId: ticket.assignedToId || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        status: "Open",
        isResolved: false,
        resolved_at: null,
        companyId: preselectedCompany?.id || "",
        assignedToId: "",
      });
    }
  }, [ticket, preselectedCompany]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyId">Company *</Label>
          {preselectedCompany ? (
            <Input 
              id="companyId" 
              value={preselectedCompany.name} 
              disabled 
              className="bg-muted"
            />
          ) : (
            <Select onValueChange={(value) => handleSelectChange("companyId", value)} value={formData.companyId} required>
              <SelectTrigger id="companyId"><SelectValue placeholder="Select a company" /></SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea id="description" value={formData.description} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignedToId">Assign To *</Label>
          <Select onValueChange={(value) => handleSelectChange("assignedToId", value)} value={formData.assignedToId} required>
            <SelectTrigger id="assignedToId"><SelectValue placeholder="Select a user" /></SelectTrigger>
            <SelectContent>
              {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(value) => handleSelectChange("status", value)} value={formData.status}>
            <SelectTrigger id="status"><SelectValue placeholder="Select a status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="InProgress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex items-center pt-6">
          <Switch id="isResolved" checked={formData.isResolved} onCheckedChange={(checked) => setFormData(prev => ({...prev, isResolved: checked}))} />
          <Label htmlFor="isResolved" className="ml-2">Mark as Resolved</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
};

export default TicketForm;
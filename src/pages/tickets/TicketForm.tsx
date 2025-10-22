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
}

const TicketForm = ({
  ticket,
  companies,
  users,
  onSave,
  onCancel,
  isSaving,
}: TicketFormProps) => {
  const [formData, setFormData] = useState<TicketFormData>({
    title: "",
    description: "",
    isResolved: false,
    companyId: "",
    assignedToId: "",
  });

  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || "",
        description: ticket.description || "",
        isResolved: ticket.isResolved || false,
        companyId: ticket.companyId || "",
        assignedToId: ticket.assignedToId || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        isResolved: false,
        companyId: "",
        assignedToId: "",
      });
    }
  }, [ticket]);

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
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">Title</Label>
        <Input id="title" value={formData.title} onChange={handleChange} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">Description</Label>
        <Textarea id="description" value={formData.description} onChange={handleChange} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="companyId" className="text-right">Company</Label>
        <Select onValueChange={(value) => handleSelectChange("companyId", value)} value={formData.companyId} required>
          <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a company" /></SelectTrigger>
          <SelectContent>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="assignedToId" className="text-right">Assign To</Label>
        <Select onValueChange={(value) => handleSelectChange("assignedToId", value)} value={formData.assignedToId} required>
          <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a user" /></SelectTrigger>
          <SelectContent>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="isResolved" className="text-right">Resolved</Label>
        <Switch id="isResolved" checked={formData.isResolved} onCheckedChange={(checked) => setFormData(prev => ({...prev, isResolved: checked}))} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
};

export default TicketForm;
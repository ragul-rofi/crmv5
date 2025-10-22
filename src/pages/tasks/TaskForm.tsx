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
import { Company, Task, User } from "@/types";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type TaskFormData = Omit<Task, "id" | "created_at" | "assignedById" | "companies" | "users">;

interface TaskFormProps {
  task: Task | null;
  companies: Company[];
  users: User[];
  onSave: (task: TaskFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const TaskForm = ({
  task,
  companies,
  users,
  onSave,
  onCancel,
  isSaving,
}: TaskFormProps) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "NotYet",
    deadline: null,
    companyId: "",
    assignedToId: "",
  });
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "NotYet",
        deadline: task.deadline,
        companyId: task.companyId || "",
        assignedToId: task.assignedToId || "",
      });
      if (task.deadline) {
        setDeadline(new Date(task.deadline));
      }
    } else {
      // Reset form for new entry
      setFormData({
        title: "",
        description: "",
        status: "NotYet",
        deadline: null,
        companyId: "",
        assignedToId: "",
      });
      setDeadline(undefined);
    }
  }, [task]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setDeadline(date);
    setFormData((prev) => ({ ...prev, deadline: date ? date.toISOString() : null }));
  }

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
        <Textarea id="description" value={formData.description || ""} onChange={handleChange} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="companyId" className="text-right">Company</Label>
        <Select onValueChange={(value) => handleSelectChange("companyId", value)} value={formData.companyId}>
          <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a company" /></SelectTrigger>
          <SelectContent>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="assignedToId" className="text-right">Assign To</Label>
        <Select onValueChange={(value) => handleSelectChange("assignedToId", value)} value={formData.assignedToId}>
          <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a user" /></SelectTrigger>
          <SelectContent>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">Status</Label>
        <Select onValueChange={(value) => handleSelectChange("status", value)} value={formData.status}>
          <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="NotYet">Not Yet</SelectItem>
            <SelectItem value="InProgress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="deadline" className="text-right">Deadline</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !deadline && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={deadline} onSelect={handleDateChange} initialFocus />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
};

export default TaskForm;
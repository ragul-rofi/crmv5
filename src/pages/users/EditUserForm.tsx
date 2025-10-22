import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/types";
import { useEffect, useState } from "react";

interface EditUserFormProps {
  user: User | null;
  onSave: (userId: string, role: User["role"]) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const ROLES: User["role"][] = ["Admin", "Head", "SubHead", "Manager", "Converter", "DataCollector"];

const EditUserForm = ({
  user,
  onSave,
  onCancel,
  isSaving,
}: EditUserFormProps) => {
  const [selectedRole, setSelectedRole] = useState<User["role"] | "">("");

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && selectedRole) {
      onSave(user.id, selectedRole as User["role"]);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="role" className="text-right">
          Role
        </Label>
        <Select
          onValueChange={(value) => setSelectedRole(value as User["role"])}
          value={selectedRole}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default EditUserForm;
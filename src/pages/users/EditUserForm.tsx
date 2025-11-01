import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  onSave: (userId: string, userData: Partial<User>) => void;
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
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "" as User["role"] | "",
    region: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        role: user.role || "",
        region: user.region || "",
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && formData.role && formData.full_name && formData.email) {
      onSave(user.id, {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role as User["role"],
        region: formData.region || null,
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => handleChange("full_name", e.target.value)}
          placeholder="Enter full name"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="Enter email"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="role">Role</Label>
        <Select
          onValueChange={(value) => handleChange("role", value)}
          value={formData.role}
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="region">Region</Label>
        <Input
          id="region"
          value={formData.region}
          onChange={(e) => handleChange("region", e.target.value)}
          placeholder="Enter region (optional)"
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
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

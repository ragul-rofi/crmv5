import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CustomFieldDefinition } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import { CustomFieldForm } from "./CustomFieldForm";

const fetchCustomFieldDefinitions = async () => {
  return api.getCustomFields();
};

const CustomFieldsManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: fields, isLoading } = useQuery<CustomFieldDefinition[]>({
    queryKey: ["customFieldDefinitions"],
    queryFn: fetchCustomFieldDefinitions,
  });

  const mutation = useMutation({
    mutationFn: async (newField: Omit<CustomFieldDefinition, "id" | "created_at">) => {
      return api.createCustomField(newField);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customFieldDefinitions"] });
      toast.success("Custom field created successfully!");
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create field: ${error.message}`);
    },
  });

  const handleSave = (data: { label: string; type: "Text" | "Number" | "Date" }) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custom Fields</CardTitle>
            <CardDescription>
              Add and manage custom data fields for your companies.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Field
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Custom Field</DialogTitle>
              </DialogHeader>
              <CustomFieldForm
                onSave={handleSave}
                onCancel={() => setIsDialogOpen(false)}
                isSaving={mutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading fields...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields && fields.length > 0 ? (
                fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell>{field.label}</TableCell>
                    <TableCell>{field.type}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    No custom fields defined yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomFieldsManager;

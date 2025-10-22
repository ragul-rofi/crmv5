import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Company, CustomFieldDefinition } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

const baseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  conversionStatus: z.enum(["Waiting", "NoReach", "Confirmed", "Finalized"]),
  customFields: z.record(z.any()).optional(),
});

interface CompanyFormProps {
  company: Company | null;
  customFieldDefs: CustomFieldDefinition[];
  onSave: (data: Omit<Company, "id" | "created_at">) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const CompanyForm = ({ company, customFieldDefs, onSave, onCancel, isSaving }: CompanyFormProps) => {
  const form = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: company?.name || "",
      website: company?.website || "",
      phone: company?.phone || "",
      email: company?.email || "",
      address: company?.address || "",
      conversionStatus: company?.conversionStatus || "Waiting",
      customFields: company?.customFields || {},
    },
  });

  useEffect(() => {
    form.reset({
      name: company?.name || "",
      website: company?.website || "",
      phone: company?.phone || "",
      email: company?.email || "",
      address: company?.address || "",
      conversionStatus: company?.conversionStatus || "Waiting",
      customFields: company?.customFields || {},
    });
  }, [company, form]);

  const onSubmit = (values: z.infer<typeof baseSchema>) => {
    onSave(values as Omit<Company, "id" | "created_at">);
  };

  const getInputType = (type: "Text" | "Number" | "Date") => {
    switch (type) {
      case "Number": return "number";
      case "Date": return "date";
      default: return "text";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="conversionStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conversion Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Waiting">Waiting</SelectItem>
                  <SelectItem value="NoReach">NoReach</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Finalized">Finalized</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {customFieldDefs.map((fieldDef) => (
          <FormField
            key={fieldDef.id}
            control={form.control}
            name={`customFields.${fieldDef.label.toLowerCase().replace(/\s/g, '_')}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fieldDef.label}</FormLabel>
                <FormControl>
                  <Input
                    type={getInputType(fieldDef.type)}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
        </div>
      </form>
    </Form>
  );
};

export default CompanyForm;
/* import { useEffect, useState } from "react";import { useEffect, useState } from "react";import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";import { useForm } from "react-hook-form";import { useForm } from "react-hook-form";

import * as z from "zod";

import { Company } from "@/types";import { zodResolver } from "@hookform/resolvers/zod";import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";import * as z from "zod";import * as z from "zod";

import {

  Select,import { Company } from "@/types";import { Company } from "@/types";

  SelectContent,

  import { useEffect, useState } from "react";
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import * as z from "zod";
  import { Company } from "@/types";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
  import { Textarea } from "@/components/ui/textarea";
  import { useUser } from "@/contexts/UserContext";
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
  import { Checkbox } from "@/components/ui/checkbox";
  import { Plus, Trash2 } from "lucide-react";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

  type ContactPerson = {
    id: string;
    name: string;
    mobile: string;
    email: string;
  };

  const baseSchema = z.object({
    name: z.string().min(1, "Company Name is required").max(255, "Company name too long"),
    email: z.string().email("Please enter a valid email address").optional().or(z.literal("")).nullable(),
    address: z.string().optional().nullable(),
    conversionStatus: z.enum(["Waiting", "NoReach", "Contacted", "Negotiating", "Confirmed"]).optional(),
    industry: z.string().optional().nullable(),
    employee_count: z.string().optional().nullable(),
    annual_revenue: z.coerce.number().optional().nullable(),
    notes: z.string().optional().nullable(),
    contact_person: z.string().min(1, "Company Contact is required").max(255, "Contact person name too long"),
    rating: z.coerce.number().optional().nullable(),
    company_type: z.enum(["YES", "NO"]).optional().nullable(),
  });

  interface CompanyFormProps {
    company: Company | null;
    onSave: (data: Omit<Company, "id" | "created_at">, contactPersons: ContactPerson[]) => void;
    onCancel: () => void;
    isSaving: boolean;
  }

  const CompanyForm = ({ company, onSave, onCancel, isSaving }: CompanyFormProps) => {
    const { userProfile } = useUser();

    const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
      { id: crypto.randomUUID(), name: "", mobile: "", email: "" },
    ]);

    const form = useForm<z.infer<typeof baseSchema>>({
      resolver: zodResolver(baseSchema),
      defaultValues: {
        name: company?.name || "",
        email: company?.email || "",
        address: company?.address || "",
        conversionStatus: company?.conversionStatus || undefined,
        industry: company?.industry || null,
        employee_count: company?.employee_count != null ? String(company.employee_count) : null,
        annual_revenue: company?.annual_revenue || null,
        notes: company?.notes || null,
        contact_person: company?.contact_person || "",
        rating: company?.rating || null,
        company_type:
          company?.company_type === "Prospect"
            ? "YES"
            : company?.company_type === "Customer"
            ? "NO"
            : null,
      },
    });

    useEffect(() => {
      form.reset({
        name: company?.name || "",
        email: company?.email || "",
        address: company?.address || "",
        conversionStatus: company?.conversionStatus || undefined,
        industry: company?.industry || null,
        employee_count: company?.employee_count != null ? String(company.employee_count) : null,
        annual_revenue: company?.annual_revenue || null,
        notes: company?.notes || null,
        contact_person: company?.contact_person || "",
        rating: company?.rating || null,
        company_type:
          company?.company_type === "Prospect"
            ? "YES"
            : company?.company_type === "Customer"
            ? "NO"
            : null,
      });
    }, [company, form]);

    const onSubmit = (values: z.infer<typeof baseSchema>) => {
      const mappedValues: Omit<Company, "id" | "created_at"> = {
        name: values.name,
        website: null,
        phone: null,
        email: values.email || null,
        address: values.address || null,
        conversionStatus: values.conversionStatus,
        customFields: null,
        industry: values.industry || null,
        employee_count: values.employee_count ? parseInt(values.employee_count) : null,
        annual_revenue: values.annual_revenue || null,
        notes: values.notes || null,
        contact_person: values.contact_person,
        company_type:
          values.company_type === "YES" ? "Prospect" : values.company_type === "NO" ? "Customer" : null,
        rating: values.rating || null,
        is_public: userProfile?.role === "DataCollector" ? true : false,
        assigned_data_collector_id: company?.assigned_data_collector_id || userProfile?.id,
      };

      onSave(mappedValues, contactPersons);
    };

    const addContactPerson = () => {
      setContactPersons((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: "", mobile: "", email: "" },
      ]);
    };

    const removeContactPerson = (id: string) => {
      setContactPersons((prev) => (prev.length > 1 ? prev.filter((cp) => cp.id !== id) : prev));
    };

    const updateContactPerson = (
      id: string,
      field: keyof ContactPerson,
      value: string,
    ) => {
      setContactPersons((prev) =>
        prev.map((cp) => (cp.id === id ? { ...cp, [field]: value } : cp)),
      );
    };

    const departmentOptions = [
      "B.E. / B.Tech",
      "MBA",
      "MCA",
      "PRO - B.Sc",
      "INTELLECT - Science",
      "INTELLECT - Engg",
      "INTELLECT - MBA",
    ];

    const handleDepartmentChange = (selected: string, isChecked: boolean) => {
      const currentValues = form.getValues("industry") || "";
      const valuesArray = currentValues
        ? currentValues.split(",").map((v) => v.trim())
        : [];
      const newValuesArray = isChecked
        ? [...valuesArray, selected]
        : valuesArray.filter((v) => v !== selected);
      form.setValue("industry", newValuesArray.join(", "));
    };

    const isDepartmentSelected = (department: string) => {
      const currentValues = form.getValues("industry") || "";
      const valuesArray = currentValues
        ? currentValues.split(",").map((v) => v.trim())
        : [];
      return valuesArray.includes(department);
    };

    const getSelectedDepartmentsText = () => {
      const currentValues = form.getValues("industry") || "";
      const valuesArray = currentValues
        ? currentValues.split(",").map((v) => v.trim())
        : [];
      return valuesArray.length === 0
        ? "Select departments"
        : valuesArray.join(", ");
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter company name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-[100px]"
                        value={field.value || ""}
                        placeholder="Enter job description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eligible Departments</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left"
                          >
                            {getSelectedDepartmentsText()}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          {departmentOptions.map((department) => (
                            <div
                              key={department}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`dept-${department}`}
                                checked={isDepartmentSelected(department)}
                                onCheckedChange={(isChecked) =>
                                  handleDepartmentChange(
                                    department,
                                    isChecked as boolean,
                                  )
                                }
                              />
                              <label
                                htmlFor={`dept-${department}`}
                                className="text-sm font-medium leading-none"
                              >
                                {department}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employee_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Batch</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        {...field}
                        value={field.value || ""}
                        placeholder="Enter batch (e.g., C26, C27)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="annual_revenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                        placeholder="Number of employees"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Contact *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter primary contact person name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        type="email"
                        placeholder="Enter email address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Location</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Enter company location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary (LPA)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null,
                          )
                        }
                        placeholder="Enter salary in LPA"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Agreement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agreement status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(userProfile?.role === "Converter" ||
                userProfile?.role === "Admin" ||
                userProfile?.role === "Manager") && (
                <FormField
                  control={form.control}
                  name="conversionStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversion Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select conversion status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Waiting">Waiting</SelectItem>
                          <SelectItem value="NoReach">No Reach</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="Negotiating">Negotiating</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormItem>
                <FormLabel>Data Added by</FormLabel>
                <FormControl>
                  <Input
                    value={userProfile?.full_name || "Current User"}
                    disabled
                    placeholder="User name"
                  />
                </FormControl>
              </FormItem>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contact Persons</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addContactPerson}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactPersons.map((person) => (
                <div
                  key={person.id}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start p-4 border rounded-lg"
                >
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name</label>
                    <Input
                      value={person.name}
                      onChange={(e) =>
                        updateContactPerson(person.id, "name", e.target.value)
                      }
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mobile</label>
                    <Input
                      value={person.mobile}
                      onChange={(e) =>
                        updateContactPerson(person.id, "mobile", e.target.value)
                      }
                      placeholder="Mobile number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input
                      type="email"
                      value={person.email}
                      onChange={(e) =>
                        updateContactPerson(person.id, "email", e.target.value)
                      }
                      placeholder="Email address"
                    />
                  </div>
                  <div className="flex items-end">
                    {contactPersons.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContactPerson(person.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Company"}
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  export default CompanyForm;
              <FormLabel>Data Added by</FormLabel>
              <FormControl>
                <Input 
                  value={userProfile?.full_name || "Current User"} 
                  disabled 
                  placeholder="User name" 
                />
              </FormControl>
            </FormItem>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Company"}</Button>
        </div>
      </form>
    </Form>
  );
};

export default CompanyForm;
*/
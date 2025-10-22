import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Contact, Task, Ticket, CustomFieldDefinition } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, ListChecks, LifeBuoy } from "lucide-react";
import { CompanyContacts } from "./company-detail/CompanyContacts";
import { CompanyTasks } from "./company-detail/CompanyTasks";
import { CompanyTickets } from "./company-detail/CompanyTickets";

const fetchCompanyWithRelations = async (id: string) => {
  const company = await api.getCompany(id);
  const [contacts, tasks, tickets, customFields] = await Promise.all([
    api.getContacts(),
    api.getTasks(),
    api.getTickets(),
    api.getCustomFields(),
  ]);
  
  return {
    company,
    contacts: contacts.filter((c: any) => c.companyId === id),
    tasks: tasks.filter((t: any) => t.companyId === id),
    tickets: tickets.filter((t: any) => t.companyId === id),
    customFieldDefs: customFields,
  };
};

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: () => fetchCompanyWithRelations(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div>Loading company details...</div>;
  }

  if (!data?.company) {
    return <div>Company not found.</div>;
  }

  const { company, contacts, tasks, tickets, customFieldDefs } = data;
  
  const getCustomFieldKey = (label: string) => label.toLowerCase().replace(/\s/g, '_');

  return (
    <div className="p-8 pt-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Building className="h-10 w-10 text-gray-600 dark:text-gray-400" />
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <p className="text-muted-foreground">{company.email || 'No email provided'}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold">Website:</span> {company.website || 'N/A'}</div>
            <div><span className="font-semibold">Email:</span> {company.email || 'N/A'}</div>
            <div><span className="font-semibold">Phone:</span> {company.phone || 'N/A'}</div>
            <div><span className="font-semibold">Address:</span> {company.address || 'N/A'}</div>
            <div><span className="font-semibold">Conversion Status:</span> {company.conversionStatus}</div>
            {customFieldDefs?.map((def: CustomFieldDefinition) => (
              <div key={def.id}>
                <span className="font-semibold">{def.label}:</span> {company.customFields?.[getCustomFieldKey(def.label)] || 'N/A'}
              </div>
            ))}
          </CardContent>
        </Card>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList>
            <TabsTrigger value="contacts"><Users className="mr-2 h-4 w-4" /> Contacts ({contacts?.length || 0})</TabsTrigger>
            <TabsTrigger value="tasks"><ListChecks className="mr-2 h-4 w-4" /> Tasks ({tasks?.length || 0})</TabsTrigger>
            <TabsTrigger value="tickets"><LifeBuoy className="mr-2 h-4 w-4" /> Tickets ({tickets?.length || 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="contacts">
            <CompanyContacts contacts={contacts as Contact[] || []} />
          </TabsContent>
          <TabsContent value="tasks">
            <CompanyTasks tasks={tasks as Task[] || []} />
          </TabsContent>
          <TabsContent value="tickets">
            <CompanyTickets tickets={tickets as Ticket[] || []} />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default CompanyDetailPage;
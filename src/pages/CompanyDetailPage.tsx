import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Contact, Ticket } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Calendar, LifeBuoy } from "lucide-react";
import { CompanyContacts } from "./company-detail/CompanyContacts";
import { CompanyFollowUps } from "./company-detail/CompanyFollowUps";
import { CompanyTickets } from "./company-detail/CompanyTickets";

const fetchCompanyWithRelations = async (id: string) => {
  try {
    const company = await api.getCompany(id);
    
    const [contacts, followUps, tickets, customFields] = await Promise.all([
      api.getContactsForCompany(id),
      api.getFollowUpsForCompany(id).catch((err) => {
        console.error('Error fetching follow-ups:', err);
        return [];
      }),
      api.getTicketsForCompany(id),
      api.getCustomFields(),
    ]);
    
    return {
      company,
      contacts,
      followUps,
      tickets,
      customFieldDefs: customFields,
    };
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
};

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["company", id],
    queryFn: () => fetchCompanyWithRelations(id!),
    enabled: !!id,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Refetch when component mounts
  });
  
  // Force refetch when component mounts
  useEffect(() => {
    if (id) {
      refetch();
    }
  }, [id, refetch]);

  if (isLoading) {
    return <div>Loading company details...</div>;
  }

  if (!data?.company) {
    return <div>Company not found.</div>;
  }

  const { company, contacts, followUps, tickets } = data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Building className="h-10 w-10 text-gray-600 dark:text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">{company.email || 'No email provided'}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="sm:col-span-2">
            <span className="font-medium">Company Name:</span> {company.name}
          </div>
          <div className="sm:col-span-2">
            <span className="font-medium">Job Description:</span> 
            <p className="mt-1 whitespace-pre-wrap">{company.notes || 'N/A'}</p>
          </div>
          <div className="sm:col-span-2">
            <span className="font-medium">Eligible Departments:</span> {company.industry || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Student Batch:</span> {company.employee_count || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Company Size:</span> {company.annual_revenue ? `${company.annual_revenue} employees` : 'N/A'}
          </div>
          <div>
            <span className="font-medium">Company Contact:</span> {company.contact_person || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Company Email:</span> {company.email || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Company Location:</span> {company.address || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Salary (LPA):</span> {company.rating ? `₹${company.rating}` : 'N/A'}
          </div>
          <div>
            <span className="font-medium">Service Agreement:</span> {
              company.company_type === 'Prospect' ? 'YES' : 
              company.company_type === 'Customer' ? 'NO' : 'N/A'
            }
          </div>
          <div className="sm:col-span-2">
            <span className="font-medium">Conversion Status:</span> 
            <Badge className="ml-2" variant={company.conversionStatus === "Confirmed" ? "default" : "secondary"}>
              {company.conversionStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="contacts" className="flex items-center justify-center">
            <Users className="mr-2 h-4 w-4" />
            <span>Contacts ({contacts?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="followups" className="flex items-center justify-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Follow-ups ({followUps?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center justify-center">
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Tickets ({tickets?.length || 0})</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="contacts">
          <CompanyContacts contacts={contacts as Contact[] || []} companyId={id!} />
        </TabsContent>
        <TabsContent value="followups">
          <CompanyFollowUps companyId={id!} followUps={followUps || []} />
        </TabsContent>
        <TabsContent value="tickets">
          <CompanyTickets tickets={tickets as Ticket[] || []} companyId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyDetailPage;
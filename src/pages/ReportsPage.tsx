import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Building, ListChecks, Ticket, Users } from "lucide-react";
import StatCard from "@/components/StatCard";

// Data fetching functions
const fetchReportStats = async () => {
  const [companies, contacts, tasks, tickets] = await Promise.all([
    api.getCompanies(),
    api.getContacts(),
    api.getTasks(),
    api.getTickets(),
  ]);

  const companyCount = companies.length;
  const contactCount = contacts.length;
  const openTasksCount = tasks.filter((task: any) => task.status !== 'Completed').length;
  const openTicketsCount = tickets.filter((ticket: any) => !ticket.isResolved).length;

  return { companyCount, contactCount, openTasksCount, openTicketsCount };
};

const fetchCompaniesForChart = async () => {
  return api.getCompanies();
};

const fetchTasksForChart = async () => {
  return api.getTasks();
};

const fetchTicketsForCharts = async () => {
  return api.getTickets();
};


const ReportsPage = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["reportStats"],
    queryFn: fetchReportStats,
  });

  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companiesForChart"],
    queryFn: fetchCompaniesForChart,
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasksForChart"],
    queryFn: fetchTasksForChart,
  });

  const { data: tickets, isLoading: isLoadingTickets } = useQuery({
    queryKey: ["ticketsForCharts"],
    queryFn: fetchTicketsForCharts,
  });

  // Process data for charts
  const companiesByMonth = companies?.reduce((acc, company) => {
    const month = format(parseISO(company.created_at), 'MMM yyyy');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const companyChartData = companiesByMonth ? Object.entries(companiesByMonth).map(([name, count]) => ({ name, count })) : [];

  const tasksByStatus = tasks?.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const taskChartData = tasksByStatus ? Object.entries(tasksByStatus).map(([name, value]) => ({ name, value })) : [];
  
  const ticketsByStatus = tickets?.reduce((acc, ticket) => {
    const status = ticket.isResolved ? 'Resolved' : 'Unresolved';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const ticketStatusChartData = ticketsByStatus ? Object.entries(ticketsByStatus).map(([name, value]) => ({ name, value })) : [];

  const ticketTrendData = tickets?.reduce((acc, ticket) => {
    const createdMonth = format(parseISO(ticket.created_at), 'MMM yyyy');
    if (!acc[createdMonth]) acc[createdMonth] = { name: createdMonth, created: 0, resolved: 0 };
    acc[createdMonth].created += 1;

    if (ticket.resolved_at) {
      const resolvedMonth = format(parseISO(ticket.resolved_at), 'MMM yyyy');
      if (!acc[resolvedMonth]) acc[resolvedMonth] = { name: resolvedMonth, created: 0, resolved: 0 };
      acc[resolvedMonth].resolved += 1;
    }
    return acc;
  }, {} as Record<string, { name: string; created: number; resolved: number; }>);
  const ticketTrendChartData = ticketTrendData ? Object.values(ticketTrendData).sort((a: any, b: any) => new Date(a.name).getTime() - new Date(b.name).getTime()) : [];


  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const isLoading = isLoadingStats || isLoadingCompanies || isLoadingTasks || isLoadingTickets;

  if (isLoading) {
    return <Layout onSearchClick={() => setSearchOpen(true)}><div>Loading reports...</div></Layout>;
  }

  return (
    <Layout onSearchClick={() => setSearchOpen(true)}>
      <div className="p-8 pt-6 space-y-6">
        <h1 className="text-3xl font-bold">Reporting & Analytics</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Companies" value={stats?.companyCount || 0} icon={Building} />
          <StatCard title="Total Contacts" value={stats?.contactCount || 0} icon={Users} />
          <StatCard title="Open Tasks" value={stats?.openTasksCount || 0} icon={ListChecks} />
          <StatCard title="Unresolved Tickets" value={stats?.openTicketsCount || 0} icon={Ticket} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ticketTrendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#8884d8" name="Tickets Created" />
                <Line type="monotone" dataKey="resolved" stroke="#82ca9d" name="Tickets Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>New Companies per Month</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="New Companies" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={taskChartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {taskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tickets by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={ticketStatusChartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {ticketStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;

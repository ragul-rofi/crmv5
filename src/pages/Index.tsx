import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import StatCard from "@/components/StatCard";
import RecentTasks from "@/components/RecentTasks";
import RecentTickets from "@/components/RecentTickets";
import { ListChecks, Ticket, Building, Users } from "lucide-react";

const fetchDashboardStats = async (userId: string) => {
  const [tasks, tickets, companies, contacts] = await Promise.all([
    api.getTasks(),
    api.getTickets(),
    api.getCompanies(),
    api.getContacts(),
  ]);

  const myOpenTasks = tasks.filter(
    (task: any) => task.assignedToId === userId && task.status !== 'Completed'
  ).length;

  const myOpenTickets = tickets.filter(
    (ticket: any) => ticket.assignedToId === userId && !ticket.isResolved
  ).length;

  return {
    myOpenTasks,
    myOpenTickets,
    totalCompanies: companies.length,
    totalContacts: contacts.length,
  };
};

const Index = () => {
  const { userProfile } = useUser();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats", userProfile?.id],
    queryFn: () => fetchDashboardStats(userProfile!.id),
    enabled: !!userProfile,
  });

  return (
    <div className="p-8 pt-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Open Tasks" value={isLoading ? "..." : stats?.myOpenTasks || 0} icon={ListChecks} />
        <StatCard title="My Open Tickets" value={isLoading ? "..." : stats?.myOpenTickets || 0} icon={Ticket} />
        <StatCard title="Total Companies" value={isLoading ? "..." : stats?.totalCompanies || 0} icon={Building} />
        <StatCard title="Total Contacts" value={isLoading ? "..." : stats?.totalContacts || 0} icon={Users} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <RecentTasks />
        <RecentTickets />
      </div>
    </div>
  );
};

export default Index;
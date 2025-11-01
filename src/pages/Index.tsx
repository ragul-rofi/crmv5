import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import { DateFilterSelector } from "@/components/analytics/DateFilterSelector";
import RecentTasks from "@/components/tasks/RecentTasks";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fetchDashboardStats = async (userRole: string, filter?: string, startDate?: string, endDate?: string) => {
  // Calculate date range for filtering
  let filterStartDate: Date | null = null;
  let filterEndDate: Date | null = null;
  
  if (filter === 'custom' && startDate && endDate) {
    filterStartDate = new Date(startDate);
    filterEndDate = new Date(endDate);
    filterEndDate.setHours(23, 59, 59, 999); // Include the entire end date
  } else if (filter && filter !== 'custom') {
    const now = new Date();
    
    switch (filter) {
      case 'week':
        filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        filterEndDate = now;
        break;
      case 'month':
        filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        filterEndDate = now;
        break;
      case 'year':
        filterStartDate = new Date(now.getFullYear(), 0, 1);
        filterEndDate = now;
        break;
    }
  }

  // For Admin, fetch all open tasks/tickets; for others, fetch user-specific counts
  const [tasksCount, ticketsCount, companiesData, contactsData, allTasks, allTickets] = await Promise.all([
    userRole === 'Admin'
      ? api.getTasks(1, 1000).then(res => ({ count: res.data?.filter((t: any) => t.status !== 'Completed').length || 0 }))
      : api.getMyOpenTasksCount(),
    userRole === 'Admin'
      ? api.getTickets(1, 1000).then(res => ({ count: res.data?.filter((t: any) => !t.isResolved).length || 0 }))
      : api.getMyOpenTicketsCount(),
    api.getCompanies(1, 1000),
    api.getContacts(1, 1000),
    api.getTasks(1, 1000),
    api.getTickets(1, 1000),
  ]);

  // Apply client-side date filtering if date range is specified
  const filterByDate = (items: any[], dateField: string = 'created_at') => {
    if (!filterStartDate || !filterEndDate || !items) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField] || item.createdAt || item.created_at);
      return itemDate >= filterStartDate! && itemDate <= filterEndDate!;
    });
  };

  // Filter data by date range
  const filteredCompanies = filterByDate(companiesData.data || []);
  const filteredContacts = filterByDate(contactsData.data || []);
  const filteredTasks = filterByDate(allTasks.data || []);
  const filteredTickets = filterByDate(allTickets.data || []);

  // Calculate conversion status counts from filtered data
  const conversionCounts = filteredCompanies.reduce((acc: any, company: any) => {
    const status = company.conversionStatus || company.conversion_status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Calculate finalization status counts from filtered data
  const finalizationCounts = filteredCompanies.reduce((acc: any, company: any) => {
    const status = company.finalization_status || 'Pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Calculate task status counts from filtered data
  const taskStatusCounts = filteredTasks.reduce((acc: any, task: any) => {
    const status = task.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Calculate ticket status counts from filtered data
  const ticketStatusCounts = filteredTickets.reduce((acc: any, ticket: any) => {
    const status = ticket.isResolved || ticket.is_resolved ? 'Resolved' : 'Open';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Filter tasks and tickets for counts if date filtering is applied
  const filteredOpenTasks = filterStartDate && filterEndDate 
    ? filteredTasks.filter((t: any) => t.status !== 'Completed').length
    : tasksCount.count;
    
  const filteredOpenTickets = filterStartDate && filterEndDate
    ? filteredTickets.filter((t: any) => !t.isResolved && !t.is_resolved).length
    : ticketsCount.count;

  // Get the 3 most recent companies
  const recentCompanies = filteredCompanies
    .sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  return {
    myOpenTasks: filteredOpenTasks,
    myOpenTickets: filteredOpenTickets,
    totalCompanies: filteredCompanies.length,
    totalContacts: filteredContacts.length,
    totalTasks: filteredTasks.length,
    totalTickets: filteredTickets.length,
    conversionCounts,
    finalizationCounts,
    taskStatusCounts,
    ticketStatusCounts,
    recentCompanies,
  };
};

const Index = () => {
  const { userProfile } = useUser();
  const [analyticsFilter, setAnalyticsFilter] = useState('month');
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>();
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats", userProfile?.id, userProfile?.role, analyticsFilter, analyticsStartDate, analyticsEndDate],
    queryFn: () => fetchDashboardStats(userProfile!.role, analyticsFilter, analyticsStartDate, analyticsEndDate),
    enabled: !!userProfile,
  });

  const handleFilterChange = (filter: string, startDate?: string, endDate?: string) => {
    setAnalyticsFilter(filter);
    setAnalyticsStartDate(startDate);
    setAnalyticsEndDate(endDate);
  };

  const conversionData = Object.entries(stats?.conversionCounts || {}).map(([name, value]) => ({ name, value }));
  const taskStatusData = Object.entries(stats?.taskStatusCounts || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 min-h-screen p-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Welcome back! Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <DateFilterSelector
            filter={analyticsFilter}
            startDate={analyticsStartDate}
            endDate={analyticsEndDate}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Key Metrics</h2>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                Loading...
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Companies */}
        <div className="bg-card text-card-foreground rounded-lg border p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0"></div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Total Companies</span>
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : (stats?.totalCompanies || 0).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-5 h-5 bg-blue-600 dark:bg-blue-400 rounded"></div>
            </div>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-card text-card-foreground rounded-lg border p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full flex-shrink-0"></div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Active Customers</span>
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : (stats?.conversionCounts?.Confirmed || 0).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-5 h-5 bg-purple-500 dark:bg-purple-400 rounded"></div>
            </div>
          </div>
        </div>

        {/* Open Tasks */}
        <div className="bg-card text-card-foreground rounded-lg border p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full flex-shrink-0"></div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Open Tasks</span>
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : (stats?.myOpenTasks || 0).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-5 h-5 bg-green-500 dark:bg-green-400 rounded"></div>
            </div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="bg-card text-card-foreground rounded-lg border p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full flex-shrink-0"></div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Open Tickets</span>
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : (stats?.myOpenTickets || 0).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-5 h-5 bg-orange-500 dark:bg-orange-400 rounded"></div>
            </div>
          </div>
        </div>

        {/* Total Finalized */}
        <div className="bg-card text-card-foreground rounded-lg border p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full flex-shrink-0"></div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Total Finalized</span>
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : (stats?.finalizationCounts?.Finalized || 0).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-5 h-5 bg-emerald-600 dark:bg-emerald-400 rounded"></div>
            </div>
          </div>
        </div>

        {/* Confirmed Status */}
        <div className="bg-card text-card-foreground rounded-lg border p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-cyan-600 dark:bg-cyan-400 rounded-full flex-shrink-0"></div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Confirmed Status</span>
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : (stats?.conversionCounts?.Confirmed || 0).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-5 h-5 bg-cyan-600 dark:bg-cyan-400 rounded"></div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Analytics Section */}
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      {/* Task Status Chart */}
      <div className="lg:col-span-2">
        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Task Status Overview</h3>
        </div>
        {taskStatusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskStatusData} style={{ backgroundColor: 'transparent' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                  }
                  return value;
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                cursor={{ fill: 'transparent' }}
                formatter={(value: any) => [value.toLocaleString(), 'Count']}
              />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">No task data available</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Tasks will appear here once created</p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div>
        <RecentTasks />
      </div>
    </div>

    {/* Additional Analytics */}
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      {/* Conversion Status Distribution */}
      <div>
        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm h-full">
        <h3 className="text-lg font-semibold mb-4">Conversion Status</h3>
        {conversionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={conversionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={false}
                labelLine={false}
                stroke="none"
              >
                {conversionData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={[
                      '#3b82f6',
                      '#10b981',
                      '#f59e0b',
                      '#8b5cf6',
                      '#ef4444'
                    ][index % 5]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: string) => {
                  const total = conversionData.reduce((sum, item) => sum + (item.value as number), 0);
                  const percent = ((value / total) * 100).toFixed(1);
                  return [`${value} (${percent}%)`, name];
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                itemStyle={{
                  color: 'hsl(var(--card-foreground))'
                }}
                labelStyle={{
                  color: 'hsl(var(--card-foreground))'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{
                  paddingTop: '10px',
                  color: 'currentColor'
                }}
                iconType="circle"
                formatter={(value, entry: any) => {
                  return `${value}: ${entry.payload.value}`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">No conversion data</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Data will appear once companies are added</p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* System Metrics */}
      <div>
        <div className="bg-card text-card-foreground rounded-lg border shadow-sm h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {stats?.totalCompanies || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total Companies</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Contacts</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {stats?.totalContacts || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Tasks</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {stats?.totalTasks || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Tickets</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {stats?.totalTickets || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                  {stats?.conversionCounts?.Confirmed && stats?.totalCompanies
                    ? ((stats.conversionCounts.Confirmed / stats.totalCompanies) * 100).toFixed(1)
                    : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        </div>
      </div>

      {/* Recent Companies */}
      <div>
        <div className="bg-card text-card-foreground rounded-lg border shadow-sm h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentCompanies && stats.recentCompanies.length > 0 ? (
              stats.recentCompanies.map((company: any) => {
                // Generate initials from company name
                const getInitials = (name: string) => {
                  const words = name.trim().split(/\s+/);
                  if (words.length === 1) {
                    return words[0].substring(0, 2).toUpperCase();
                  }
                  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
                };
                
                // Determine status from conversionStatus or finalization_status
                const status = company.conversionStatus || company.conversion_status || company.finalization_status || company.finalizationStatus || 'Pending';
                
                // Status badge color mapping
                const statusColors: Record<string, string> = {
                  'Confirmed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                  'Active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                  'Approved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                  'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                  'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                  'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                  'New': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                };
                
                // Initial badge colors
                const initialColors = [
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                  'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
                  'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
                ];
                
                const colorIndex = (company.id || 0) % initialColors.length;
                const statusColorClass = statusColors[status] || statusColors['Pending'];
                
                return (
                  <div key={company.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors duration-200">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${initialColors[colorIndex]}`}>
                      <span className="text-sm font-semibold">
                        {getInitials(company.companyName || company.company_name || 'UN')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{company.companyName || company.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {company.industry || company.industryType || company.industry_type || 'N/A'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorClass}`}>
                      {status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No companies yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Companies will appear here when added</p>
              </div>
            )}
          </div>
        </CardContent>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Index;
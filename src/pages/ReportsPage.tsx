import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Download, FileText, TrendingUp, Users, CheckCircle, AlertCircle, Building } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('companies');
  const [dateRange, setDateRange] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activityDays, setActivityDays] = useState(30);

  // Fetch analytics data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => api.getAnalyticsDashboard(),
  });

  const { data: companyStats, isLoading: isCompaniesLoading } = useQuery({
    queryKey: ['analytics-companies'],
    queryFn: () => api.getAnalyticsCompanies(),
  });

  const { data: taskStats, isLoading: isTasksLoading } = useQuery({
    queryKey: ['analytics-tasks'],
    queryFn: () => api.getAnalyticsTasks(),
  });

  const { data: ticketStats, isLoading: isTicketsLoading } = useQuery({
    queryKey: ['analytics-tickets'],
    queryFn: () => api.getAnalyticsTickets(),
  });

  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['analytics-activity', activityDays],
    queryFn: () => api.getAnalyticsActivity(activityDays),
  });

  const exportReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/export/${reportType}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Report exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 md:h-6 md:w-6" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Generate and export comprehensive business reports</p>
        </div>
        <Button onClick={exportReport} disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          {loading ? 'Exporting...' : 'Export Report'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="companies">Companies Report</SelectItem>
            <SelectItem value="tasks">Tasks Report</SelectItem>
            <SelectItem value="tickets">Tickets Report</SelectItem>
            <SelectItem value="users">Users Report</SelectItem>
          </SelectContent>
        </Select>
        
        <DatePickerWithRange
          date={dateRange}
          onDateChange={setDateRange}
          className="w-56"
        />
      </div>

      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Companies</CardTitle>
            <Building className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1">
            {isDashboardLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-bold">{dashboardData?.companies || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Tasks</CardTitle>
            <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1">
            {isDashboardLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-bold">{dashboardData?.tasks || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Tickets</CardTitle>
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1">
            {isDashboardLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-bold">{dashboardData?.tickets || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Users</CardTitle>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1">
            {isDashboardLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-bold">{dashboardData?.users || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Company Conversion Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Company Conversion Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isCompaniesLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={companyStats?.byConversion?.map((item: any) => ({
                      name: item.conversion_status || 'Unknown',
                      value: parseInt(item.count)
                    })) || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                    labelLine={false}
                    stroke="none"
                  >
                    {companyStats?.byConversion?.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      const total = companyStats?.byConversion?.reduce((sum: number, item: any) => sum + parseInt(item.count), 0) || 0;
                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                      return [`${value} (${percent}%)`, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--card-foreground))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                    itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                    labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ paddingTop: '10px', color: 'currentColor' }}
                    iconType="circle"
                    formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isTasksLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={taskStats?.byStatus?.map((item: any) => ({
                  status: item.status,
                  count: parseInt(item.count)
                })) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis 
                    dataKey="status"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
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
                  />
                  <Bar dataKey="count" fill="#3b82f6" name="Tasks" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ticket Status Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ticket Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isTicketsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ticketStats?.byStatus?.map((item: any) => ({
                      name: item.status,
                      value: parseInt(item.count)
                    })) || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                    labelLine={false}
                    stroke="none"
                  >
                    {ticketStats?.byStatus?.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      const total = ticketStats?.byStatus?.reduce((sum: number, item: any) => sum + parseInt(item.count), 0) || 0;
                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                      return [`${value} (${percent}%)`, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--card-foreground))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                    itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                    labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ paddingTop: '10px', color: 'currentColor' }}
                    iconType="circle"
                    formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Users by Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Users by Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {isTasksLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart 
                  data={taskStats?.byUser?.slice(0, 5).map((item: any) => ({
                    name: item.full_name,
                    tasks: parseInt(item.task_count)
                  })) || []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis 
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
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
                  />
                  <Bar dataKey="tasks" fill="#8b5cf6" name="Tasks Assigned" radius={[0, 6, 6, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Users by Tickets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Users by Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {isTicketsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart 
                  data={ticketStats?.byUser?.slice(0, 5).map((item: any) => ({
                    name: item.full_name,
                    tickets: parseInt(item.ticket_count)
                  })) || []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis 
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
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
                  />
                  <Bar dataKey="tickets" fill="#ef4444" name="Tickets Assigned" radius={[0, 6, 6, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Activity Timeline (Last {activityDays} Days)</CardTitle>
          <Select value={activityDays.toString()} onValueChange={(val) => setActivityDays(parseInt(val))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="60">60 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isActivityLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
                <LineChart 
                  data={activityData?.reduce((acc: any[], item: any) => {
                    const existing = acc.find(a => a.date === item.date);
                    if (existing) {
                      existing[item.type] = parseInt(item.count);
                    } else {
                      acc.push({
                        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        [item.type]: parseInt(item.count)
                      });
                    }
                    return acc;
                  }, []).reverse() || []}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis 
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--card-foreground))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: 'currentColor' }}
                  />
                  <Line type="monotone" dataKey="company" stroke="#3b82f6" name="Companies" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="task" stroke="#10b981" name="Tasks" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
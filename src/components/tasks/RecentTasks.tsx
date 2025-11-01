import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

/**
 * Fetches the 5 most recent tasks for the current user
 * @returns A promise that resolves to an array of Task objects
 */
const fetchRecentTasks = async () => {
  const response = await api.getMyTasks(1, 5);
  return response.data || [];
};

/**
 * A component that displays the 5 most recent tasks assigned to the current user
 * @returns A React element representing the recent tasks card
 */
const RecentTasks = () => {
  const { data: userTasks, isLoading } = useQuery<Task[]>({
    queryKey: ["recentTasks"],
    queryFn: fetchRecentTasks,
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>My Recent Tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {userTasks && userTasks.length > 0 ? (
              userTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      For: <Link to={`/company/${task.companyId}`} className="hover:underline">{task.companies?.name}</Link>
                    </p>
                  </div>
                  <Badge variant={task.status === "Completed" ? "default" : "secondary"}>
                    {task.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent tasks assigned to you.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTasks;
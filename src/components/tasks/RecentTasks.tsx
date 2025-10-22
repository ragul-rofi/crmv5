import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
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
  return api.getTasks();
};

/**
 * A component that displays the 5 most recent tasks assigned to the current user
 * @returns A React element representing the recent tasks card
 */
const RecentTasks = () => {
  const { userProfile } = useUser();
  const { data: allTasks, isLoading } = useQuery<Task[]>({
    queryKey: ["recentTasks"],
    queryFn: fetchRecentTasks,
  });

  // Filter tasks assigned to the current user and get the 5 most recent
  const userTasks = userProfile && allTasks 
    ? allTasks
        .filter(task => task.assignedToId === userProfile.id)
        .slice(0, 5)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Recent Tasks</CardTitle>
      </CardHeader>
      <CardContent>
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

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

const fetchRecentTasks = async () => {
  const tasks = await api.getTasks();
  return tasks.slice(0, 5);
};

const RecentTasks = () => {
  const { userProfile } = useUser();
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["recentTasks"],
    queryFn: fetchRecentTasks,
  });

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
            {tasks && tasks.length > 0 ? (
              tasks.map((task) => (
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
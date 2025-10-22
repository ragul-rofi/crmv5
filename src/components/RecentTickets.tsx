import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Ticket } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fetchRecentTickets = async () => {
  const tickets = await api.getTickets();
  return tickets.slice(0, 5);
};

const RecentTickets = () => {
  const { userProfile } = useUser();
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["recentTickets"],
    queryFn: fetchRecentTickets,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Recent Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {tickets && tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ticket.title}</p>
                    <p className="text-sm text-muted-foreground">
                      For: <Link to={`/company/${ticket.companyId}`} className="hover:underline">{ticket.companies?.name}</Link>
                    </p>
                  </div>
                  <Badge variant={ticket.isResolved ? "default" : "secondary"}>
                    {ticket.isResolved ? "Resolved" : "Open"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent tickets involving you.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTickets;
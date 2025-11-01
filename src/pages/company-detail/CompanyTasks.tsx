import { Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/layout/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Fixed TypeScript errors - using correct property names
interface CompanyTasksProps {
  tasks: Task[];
}

export const CompanyTasks = ({ tasks }: CompanyTasksProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Title</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Due Date</TableHead>
              <TableHead className="whitespace-nowrap">Assigned To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium whitespace-nowrap">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant={task.status === "Completed" ? "default" : "secondary"}>{task.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{task.deadline ? format(new Date(task.deadline), "PPP") : "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap">{task.users?.full_name || "Unassigned"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No tasks found for this company.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
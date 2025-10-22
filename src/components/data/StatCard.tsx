import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  /** The title of the stat card */
  title: string;
  /** The value to display in the stat card */
  value: string | number;
  /** The icon to display in the stat card */
  icon: LucideIcon;
}

/**
 * A component that displays a statistic in a card format with an icon
 * @param props - The props for the StatCard component
 * @returns A React element representing the stat card
 */
const StatCard = ({ title, value, icon: Icon }: StatCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export default StatCard;

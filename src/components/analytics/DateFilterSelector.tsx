import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DateFilterSelectorProps {
  filter: string;
  startDate?: string;
  endDate?: string;
  onFilterChange: (filter: string, startDate?: string, endDate?: string) => void;
  isLoading?: boolean;
}

export const DateFilterSelector = ({ filter, startDate, endDate, onFilterChange, isLoading }: DateFilterSelectorProps) => {
  const [customStartDate, setCustomStartDate] = useState<string>(startDate || '');
  const [customEndDate, setCustomEndDate] = useState<string>(endDate || '');

  const handleFilterChange = (newFilter: string) => {
    if (newFilter === 'custom') {
      onFilterChange(newFilter, customStartDate, customEndDate);
    } else {
      onFilterChange(newFilter);
    }
  };

  const handleCustomDateChange = () => {
    if (!customStartDate || !customEndDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    if (new Date(customStartDate) > new Date(customEndDate)) {
      alert('Start date must be before end date');
      return;
    }
    
    onFilterChange('custom', customStartDate, customEndDate);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <Select value={filter} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {filter === 'custom' && (
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="w-[140px]"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="w-[140px]"
          />
          <Button onClick={handleCustomDateChange} size="sm" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                Applying...
              </>
            ) : (
              'Apply'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
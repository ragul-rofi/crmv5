import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from './card';
import { Badge } from './badge';

interface MobileTableProps {
  data: any[];
  renderItem: (item: any, index: number) => ReactNode;
  emptyMessage?: string;
}

export function MobileTable({ data, renderItem, emptyMessage = "No data available" }: MobileTableProps) {
  // Ensure data is an array
  const dataArray = Array.isArray(data) ? data : [];
  
  if (dataArray.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {dataArray.map((item, index) => renderItem(item, index))}
    </div>
  );
}

export function MobileCompanyCard({ company, onEdit, onDelete }: any) {
  return (
    <Card key={company.id} className="p-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{company.name}</h3>
          <Badge variant={company.conversionStatus === 'Confirmed' ? 'default' : 'secondary'}>
            {company.conversionStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          {company.phone && (
            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <a href={`tel:${company.phone}`} className="text-blue-600">{company.phone}</a>
            </div>
          )}
          {company.email && (
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <a href={`mailto:${company.email}`} className="text-blue-600">{company.email}</a>
            </div>
          )}
          {company.contact_person && (
            <div className="flex justify-between">
              <span className="text-gray-500">Contact:</span>
              <span>{company.contact_person}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => onEdit(company)} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded text-sm">
            Edit
          </button>
          <button onClick={() => onDelete(company)} className="flex-1 bg-red-600 text-white py-2 px-4 rounded text-sm">
            Delete
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
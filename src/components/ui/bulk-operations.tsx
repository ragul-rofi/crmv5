import React, { useState } from 'react';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Trash2, Edit, Archive, Download, FileUp } from 'lucide-react';
import { toast } from 'sonner';

interface BulkOperationsProps {
  selectedIds: string[];
  entityType: 'companies' | 'tasks' | 'tickets' | 'users';
  onBulkAction: (action: string, ids: string[], data?: any) => Promise<void>;
  onClearSelection: () => void;
}

export function BulkOperations({ selectedIds, entityType, onBulkAction, onClearSelection }: BulkOperationsProps) {
  const [loading, setLoading] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

  if (selectedIds.length === 0) return null;

  const handleBulkAction = async (action: string, data?: any) => {
    setLoading(true);
    try {
      await onBulkAction(action, selectedIds, data);
      toast.success(`${action} completed for ${selectedIds.length} items`);
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus) return;
    await handleBulkAction('updateStatus', { status: bulkStatus });
  };

  const handleBulkFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png';
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        await handleBulkAction('uploadFiles', { files: Array.from(files) });
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-sm font-medium">
        {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
      </span>
      
      <div className="flex items-center gap-2 ml-auto">
        {entityType === 'companies' && (
          <>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOT">HOT</SelectItem>
                <SelectItem value="WARM">WARM</SelectItem>
                <SelectItem value="COLD">COLD</SelectItem>
                <SelectItem value="NEW">NEW</SelectItem>
                <SelectItem value="CLOSED">CLOSED</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              size="sm"
              onClick={handleBulkStatusUpdate}
              disabled={!bulkStatus || loading}
            >
              <Edit className="h-4 w-4 mr-1" />
              Update Status
            </Button>
          </>
        )}

        {entityType === 'tasks' && (
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NotYet">Not Started</SelectItem>
              <SelectItem value="InProgress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleBulkFileUpload}
          disabled={loading}
        >
          <FileUp className="h-4 w-4 mr-1" />
          Upload Files
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkAction('export')}
          disabled={loading}
        >
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkAction('archive')}
          disabled={loading}
        >
          <Archive className="h-4 w-4 mr-1" />
          Archive
        </Button>
        
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleBulkAction('delete')}
          disabled={loading}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
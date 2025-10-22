import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Company } from "@/types";

interface ImportCompaniesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CompanyCsvRow = Omit<Company, "id" | "created_at">;

export const ImportCompaniesModal = ({ isOpen, onClose }: ImportCompaniesModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  const bulkImport = async (companies: any[]) => {
    const promises = companies.map(company => api.createCompany(company));
    return Promise.all(promises);
  };

  const importMutation = useMutation({
    mutationFn: async (newCompanies: CompanyCsvRow[]) => {
      await bulkImport(newCompanies);
    },
    onSuccess: () => {
      toast.success("Companies imported successfully!");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      onClose();
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
    onSettled: () => {
      setIsImporting(false);
      setFile(null);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast.warning("Please select a file to import.");
      return;
    }

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Basic validation
        const requiredFields = ["name", "industry", "status", "conversionStatus"];
        const firstRow = results.data[0] as any;
        if (!firstRow || !requiredFields.every(field => field in firstRow)) {
          toast.error("Invalid CSV format. Required columns are: name, industry, status, conversionStatus.");
          setIsImporting(false);
          return;
        }
        
        const companiesToImport = results.data as CompanyCsvRow[];
        importMutation.mutate(companiesToImport);
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
        setIsImporting(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Companies from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with the following columns: <strong>name, industry, status, conversionStatus</strong>.
            <br />
            <span className="text-xs">Example: "Innovate Inc.", "Technology", "Active", "Prospect"</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting || !file}>
              {isImporting ? "Importing..." : "Import Companies"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Company } from "@/types";

interface ImportCompaniesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CompanyCsvRow = {
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  conversionStatus?: "Waiting" | "NoReach" | "Confirmed" | "Finalized";
};

export const ImportCompaniesModal = ({ isOpen, onClose }: ImportCompaniesModalProps) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const mutation = useMutation({
    mutationFn: async (companies: Omit<Company, "id" | "created_at" | "customFields">[]) => {
      // Import companies one by one
      const promises = companies.map(company => api.createCompany(company));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Companies imported successfully!");
      onClose();
    },
    onError: (error: Error) => {
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
      toast.error("Please select a file to import.");
      return;
    }

    setIsImporting(true);

    Papa.parse<CompanyCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredHeaders = ["name"];
        const headers = results.meta.fields || [];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          toast.error(`CSV is missing required headers: ${missingHeaders.join(", ")}`);
          setIsImporting(false);
          return;
        }
        
        // Filter out any rows that don't have a name
        const validData = results.data.filter(row => row.name && row.name.trim() !== "");
        
        if (validData.length === 0) {
            toast.error("No valid data found in the CSV file.");
            setIsImporting(false);
            return;
        }

        // Transform CSV data to match Company type
        const transformedData = validData.map(row => ({
          name: row.name,
          website: row.website || null,
          phone: row.phone || null,
          email: row.email || null,
          address: row.address || null,
          conversionStatus: row.conversionStatus || 'Waiting' as const,
        }));

        mutation.mutate(transformedData);
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
            Upload a CSV file with company data. The file must contain a 'name' column.
            Optional columns include: website, phone, email, address, conversionStatus.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

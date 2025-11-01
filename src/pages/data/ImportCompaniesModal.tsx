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
import { Download } from "lucide-react";

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
  notes?: string;
  industry?: string;
  employee_count?: string; // stored as text in DB schema
  annual_revenue?: string | number;
  contact_person?: string;
  rating?: string | number;
  company_type?: 'YES' | 'NO'; // service agreement per DB schema
  conversionStatus?: "Waiting" | "NoReach" | "Contacted" | "Negotiating" | "Confirmed" | "Finalized";
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

  const handleDownloadTemplate = () => {
    // CSV template with column names aligned to new company form fields
    const templateData = [
      {
        name: "Sample Tech Corp",
        email: "contact@sampletechcorp.com",
        address: "123 Tech Street, San Francisco, CA 94105",
        notes: "Looking for Full Stack Developers and Data Scientists",
        industry: "B.E. / B.Tech, MCA",
        employee_count: "C26",
        annual_revenue: "250",
        contact_person: "John Smith",
        rating: "12.5",
        company_type: "YES",
        conversionStatus: "Waiting"
      }
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "company_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Template downloaded successfully!");
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
  const requiredHeaders = ["name"]; // Only name is required; other columns are optional
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

        // Transform CSV data to match Company payload
        const transformedData = validData.map(row => {
          // Map CSV conversionStatus values to valid Company conversionStatus values
          let conversionStatus: "Waiting" | "NoReach" | "Contacted" | "Negotiating" | "Confirmed" = 'Waiting';
          
          if (row.conversionStatus) {
            switch (row.conversionStatus as string) {
              case 'NoReach':
                conversionStatus = 'NoReach';
                break;
              case 'Contacted':
                conversionStatus = 'Contacted';
                break;
              case 'Negotiating':
                conversionStatus = 'Negotiating';
                break;
              case 'Confirmed':
                conversionStatus = 'Confirmed';
                break;
              case 'Finalized': // Map Finalized to Confirmed
                conversionStatus = 'Confirmed';
                break;
              default:
                conversionStatus = 'Waiting';
            }
          }
          
          return {
            name: row.name,
            website: row.website || null,
            phone: row.phone || null,
            email: row.email || null,
            address: row.address || null,
            notes: row.notes || null,
            industry: row.industry || null,
            employee_count: row.employee_count || null, // text field in DB
            annual_revenue: row.annual_revenue !== undefined && row.annual_revenue !== null && String(row.annual_revenue).trim() !== ''
              ? Number(row.annual_revenue)
              : null,
            contact_person: row.contact_person || null,
            rating: row.rating !== undefined && row.rating !== null && String(row.rating).trim() !== ''
              ? Number(row.rating)
              : null,
            company_type: (row.company_type === 'YES' ? 'Prospect' : row.company_type === 'NO' ? 'Customer' : null) as "Prospect" | "Customer" | "Partner" | "Competitor" | "Vendor" | null,
            conversionStatus: conversionStatus,
          }
        });

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
      <DialogContent className="sm:max-w-[600px]" aria-describedby="import-companies-dialog-description">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between gap-4 pr-4">
            <DialogTitle>Import Companies from CSV</DialogTitle>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="shrink-0">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
          <DialogDescription id="import-companies-dialog-description">
            Upload a CSV file with company data. The file must contain a 'name' column.
            Optional columns include: notes, industry, employee_count, annual_revenue, contact_person, email, address, rating, company_type.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-6">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input 
              id="csv-file" 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-xs text-muted-foreground">Selected: {file.name}</p>
            )}
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !file} className="min-w-[100px]">
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Company, Contact } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Pick<Company, "id" | "name">[];
}

interface ContactCsvRow {
  name: string;
  email?: string;
  phone?: string;
  company_name: string;
}

export const ImportContactsModal = ({ isOpen, onClose, companies }: ImportContactsModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (newContacts: Omit<Contact, "id" | "created_at">[]) => {
      // Import contacts one by one
      const promises = newContacts.map(contact => api.createContact(contact));
      await Promise.all(promises);
      return newContacts.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} contacts imported successfully!`);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`);
    },
    onSettled: () => {
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

    const companyMap = new Map(companies.map(c => [c.name.toLowerCase(), c.id]));

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as ContactCsvRow[];
        const contactsToImport: Omit<Contact, "id" | "created_at">[] = [];
        let skippedCount = 0;

        for (const row of rows) {
          if (!row.name || !row.company_name) {
            skippedCount++;
            continue;
          }

          const companyId = companyMap.get(row.company_name.toLowerCase());
          if (companyId) {
            contactsToImport.push({
              name: row.name,
              email: row.email || null,
              phone: row.phone || null,
              companyId: companyId,
            });
          } else {
            skippedCount++;
          }
        }

        if (contactsToImport.length > 0) {
          importMutation.mutate(contactsToImport);
        } else {
            toast.error("No valid contacts found to import. Check company names.");
        }

        if (skippedCount > 0) {
          toast.warning(`${skippedCount} rows were skipped due to missing data or unmatched company names.`);
        }
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Import Contacts from CSV</DialogTitle>
                <DialogDescription>
                    Upload a CSV with columns: <strong>name, email, phone, company_name</strong>. The company name must match an existing company.
                </DialogDescription>
            </DialogHeader>
            <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={importMutation.isPending}>Cancel</Button>
                <Button onClick={handleImport} disabled={importMutation.isPending || !file}>
                    {importMutation.isPending ? "Importing..." : "Import Contacts"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
};

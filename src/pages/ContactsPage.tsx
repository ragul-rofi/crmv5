import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Company, Contact } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "./data/DataTable";
import { getColumns } from "./contacts/columns";
import ContactForm from "./contacts/ContactForm";
import { ImportContactsModal } from "./contacts/ImportContactsModal";
import { PlusCircle, Upload } from "lucide-react";

const fetchContacts = async () => {
  return api.getContacts();
};

const fetchCompanies = async () => {
  return api.getCompanies();
};

const ContactsPage = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const { data: contacts, isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
  });

  const { data: companies, isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });

  const mutation = useMutation({
    mutationFn: async (newContact: any) => {
      const { id, ...contactData } = newContact;
      if (id) {
        return api.updateContact(id, contactData);
      } else {
        return api.createContact(contactData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success(
        `Contact ${selectedContact ? "updated" : "added"} successfully.`,
      );
      setIsDialogOpen(false);
      setSelectedContact(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return api.deleteContact(contactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted successfully.");
      setIsAlertOpen(false);
      setSelectedContact(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddNew = () => {
    setSelectedContact(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDialogOpen(true);
  };

  const handleDelete = (contact: Contact) => {
    setSelectedContact(contact);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedContact) {
      deleteMutation.mutate(selectedContact.id);
    }
  };

  const handleSave = (contactData: Omit<Contact, "id" | "created_at" | "companies">) => {
    mutation.mutate({ ...contactData, id: selectedContact?.id });
  };

  const columns = useMemo(
    () => getColumns(handleEdit, handleDelete),
    [],
  );

  const isLoading = isLoadingContacts || isLoadingCompanies;

  return (
    <div className="p-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Contacts</h1>
          <div className="flex space-x-2">
            <Button onClick={() => setImportModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Contact
            </Button>
          </div>
        </div>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            data={contacts || []}
            filterColumnId="name"
            filterPlaceholder="Filter by contact name..."
          />
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedContact ? "Edit Contact" : "Add New Contact"}
              </DialogTitle>
              <DialogDescription>
                {selectedContact
                  ? "Update the details of the contact."
                  : "Enter the details for the new contact."}
              </DialogDescription>
            </DialogHeader>
            <ContactForm
              contact={selectedContact}
              companies={companies || []}
              onSave={handleSave}
              onCancel={() => setIsDialogOpen(false)}
              isSaving={mutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                contact &quot;{selectedContact?.name}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ImportContactsModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} companies={companies || []} />
      </div>
  );
};

export default ContactsPage;
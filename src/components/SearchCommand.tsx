import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Building, Contact, ListChecks, LifeBuoy } from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  type: "Company" | "Contact" | "Task" | "Ticket";
  url: string;
}

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchCommand = ({ open, onOpenChange }: SearchCommandProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  useEffect(() => {
    const searchData = async () => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const [companies, contacts, tasks, tickets] = await Promise.all([
          api.getCompanies(),
          api.getContacts(),
          api.getTasks(),
          api.getTickets(),
        ]);

        const searchLower = debouncedQuery.toLowerCase();
        const filtered = [
          ...companies.filter((c: any) => c.name?.toLowerCase().includes(searchLower)).map((c: any) => ({ ...c, type: 'company' })),
          ...contacts.filter((c: any) => c.name?.toLowerCase().includes(searchLower)).map((c: any) => ({ ...c, type: 'contact' })),
          ...tasks.filter((t: any) => t.title?.toLowerCase().includes(searchLower)).map((t: any) => ({ ...t, type: 'task' })),
          ...tickets.filter((t: any) => t.title?.toLowerCase().includes(searchLower)).map((t: any) => ({ ...t, type: 'ticket' })),
        ];
        setResults(filtered.slice(0, 10));
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchData();
  }, [debouncedQuery]);

  const handleSelect = (url: string) => {
    navigate(url);
    onOpenChange(false);
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case "Company": return <Building className="mr-2 h-4 w-4" />;
      case "Contact": return <Contact className="mr-2 h-4 w-4" />;
      case "Task": return <ListChecks className="mr-2 h-4 w-4" />;
      case "Ticket": return <LifeBuoy className="mr-2 h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search for companies, contacts, tasks..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && <CommandEmpty>Searching...</CommandEmpty>}
        {!loading && !results.length && debouncedQuery && <CommandEmpty>No results found.</CommandEmpty>}
        
        <CommandGroup heading="Companies">
          {results.filter(r => r.type === 'Company').map(r => (
            <CommandItem key={r.id} onSelect={() => handleSelect(r.url)}>
              {getIcon(r.type)}
              <span>{r.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Contacts">
          {results.filter(r => r.type === 'Contact').map(r => (
            <CommandItem key={r.id} onSelect={() => handleSelect(r.url)}>
              {getIcon(r.type)}
              <span>{r.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Tasks">
          {results.filter(r => r.type === 'Task').map(r => (
            <CommandItem key={r.id} onSelect={() => handleSelect(r.url)}>
              {getIcon(r.type)}
              <span>{r.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Tickets">
          {results.filter(r => r.type === 'Ticket').map(r => (
            <CommandItem key={r.id} onSelect={() => handleSelect(r.url)}>
              {getIcon(r.type)}
              <span>{r.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
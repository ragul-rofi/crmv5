import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Building, Contact, ListChecks, LifeBuoy, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  title?: string;
  type: "company" | "contact" | "task" | "ticket";
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

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    let isCancelled = false;

    const searchData = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Use the dedicated search API endpoint
        const searchResponse = await api.search(debouncedQuery);

        // Don't update state if this search was cancelled
        if (isCancelled) return;
        
        const companyResults: SearchResult[] = (searchResponse.companies || [])
          .map((c: any) => ({ 
            id: c.id, 
            name: c.name, 
            type: 'company' as const, 
            url: `/company/${c.id}` 
          }));

        const contactResults: SearchResult[] = (searchResponse.contacts || [])
          .map((c: any) => ({ 
            id: c.id, 
            name: c.name, 
            type: 'contact' as const, 
            url: `/company/${c.company_id || c.companyid}` 
          }));

        const taskResults: SearchResult[] = (searchResponse.tasks || [])
          .map((t: any) => ({ 
            id: t.id, 
            name: t.title, 
            title: t.title,
            type: 'task' as const, 
            url: `/tasks?taskId=${t.id}` 
          }));

        const ticketResults: SearchResult[] = (searchResponse.tickets || [])
          .map((t: any) => ({ 
            id: t.id, 
            name: t.title, 
            title: t.title,
            type: 'ticket' as const, 
            url: `/tickets?ticketId=${t.id}` 
          }));

        if (!isCancelled) {
          setResults([...companyResults, ...contactResults, ...taskResults, ...ticketResults]);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Search error:', error);
          setResults([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    searchData();

    // Cleanup function to cancel ongoing search
    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  const handleSelect = (url: string) => {
    navigate(url);
    onOpenChange(false);
    setQuery("");
    setResults([]);
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case "company": return <Building className="mr-2 h-4 w-4" />;
      case "contact": return <Contact className="mr-2 h-4 w-4" />;
      case "task": return <ListChecks className="mr-2 h-4 w-4" />;
      case "ticket": return <LifeBuoy className="mr-2 h-4 w-4" />;
      default: return null;
    }
  };

  const companyResults = results.filter(r => r.type === 'company');
  const contactResults = results.filter(r => r.type === 'contact');
  const taskResults = results.filter(r => r.type === 'task');
  const ticketResults = results.filter(r => r.type === 'ticket');

  // Determine if we should show results
  const hasValidResults = results.length > 0 && debouncedQuery.length >= 2;
  const shouldShowEmptyState = !loading && debouncedQuery.length >= 2 && results.length === 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search companies, contacts, tasks, tickets..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        )}
        
        {!loading && debouncedQuery.length === 0 && (
          <CommandEmpty>Start typing to search companies, contacts, tasks, and tickets...</CommandEmpty>
        )}
        
        {!loading && debouncedQuery.length > 0 && debouncedQuery.length < 2 && (
          <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
        )}
        
        {shouldShowEmptyState && (
          <CommandEmpty>No results found for "{debouncedQuery}"</CommandEmpty>
        )}
        
        {!loading && hasValidResults && companyResults.length > 0 && (
          <CommandGroup heading="Companies">
            {companyResults.map(r => (
              <CommandItem key={r.id} onSelect={() => handleSelect(r.url)}>
                {getIcon(r.type)}
                <span>{r.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {!loading && hasValidResults && contactResults.length > 0 && (
          <CommandGroup heading="Contacts">
            {contactResults.map(r => (
              <CommandItem key={r.id} onSelect={() => handleSelect(r.url)}>
                {getIcon(r.type)}
                <span>{r.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {!loading && hasValidResults && taskResults.length > 0 && (
          <CommandGroup heading="Tasks">
            {taskResults.map(r => (
              <CommandItem key={r.id} onSelect={() => handleSelect(r.url)}>
                {getIcon(r.type)}
                <span>{r.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {!loading && hasValidResults && ticketResults.length > 0 && (
          <CommandGroup heading="Tickets">
            {ticketResults.map(r => (
              <CommandItem key={r.id} onSelect={() => handleSelect(r.url)}>
                {getIcon(r.type)}
                <span>{r.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

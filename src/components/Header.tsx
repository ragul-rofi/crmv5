import UserNav from "./UserNav";
import NotificationBell from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { Search } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  onSearchClick: () => void;
}

const Header = ({ onSearchClick }: HeaderProps) => {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-8 dark:bg-gray-950 dark:border-gray-800">
      <div>
        <Button variant="outline" onClick={onSearchClick} className="flex items-center gap-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <NotificationBell />
        <UserNav />
      </div>
    </header>
  );
};

export default Header;
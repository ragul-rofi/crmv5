import UserNav from "../users/UserNav";
import NotificationBell from "../notifications/NotificationBell";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

interface HeaderProps {
  onSearchClick: () => void;
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

const Header = ({ onSearchClick, onMenuClick, sidebarOpen }: HeaderProps) => {
  const { userProfile } = useUser();
  
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          {/* Logo for mobile when sidebar is closed */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-foreground">Silva</span>
          </div>
          
          <h2 className="text-base md:text-lg font-semibold text-foreground hidden sm:block">
            Hello, {userProfile?.full_name || 'User'}
          </h2>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSearchClick} 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground border-border hover:border-primary/50 transition-colors duration-200"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <div className="flex items-center gap-2 md:gap-3">
          <NotificationBell />
          <UserNav />
        </div>
      </div>
    </header>
  );
};

export default Header;
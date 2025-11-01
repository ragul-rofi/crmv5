import { Link, useLocation } from "react-router-dom";
import { Home, FileText, Users, Building, LifeBuoy, ClipboardList, Shield, CheckCircle, Settings, Bell, Activity, FileSearch, X } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface AppSidebarProps {
  onClose?: () => void;
}

const AppSidebar = ({ onClose }: AppSidebarProps) => {
  const location = useLocation();
  const permissions = usePermissions();

  const navItems = [
    { href: "/", icon: <Home size={18} />, label: "Dashboard" },
    { href: "/data", icon: <Building size={18} />, label: "Companies" },
    { href: "/tasks", icon: <ClipboardList size={18} />, label: "Tasks" },
    { href: "/finalized-data", icon: <CheckCircle size={18} />, label: "Finalized Data", requiresPermission: "canReadFinalized" },
    { href: "/tickets", icon: <LifeBuoy size={18} />, label: "Tickets" },
    { href: "/users", icon: <Users size={18} />, label: "Users", requiresPermission: "canManageUsers" },
    { href: "/reports", icon: <FileSearch size={18} />, label: "Reports", requiresPermission: "canRead" },
    { href: "/notifications", icon: <Bell size={18} />, label: "Notifications" },
    { href: "/settings", icon: <Settings size={18} />, label: "Settings" },
    { href: "/health", icon: <Activity size={18} />, label: "System Health", requiresRole: "Admin" },
    { href: "/audit-logs", icon: <Shield size={18} />, label: "Audit Logs", requiresRole: "Admin" },
    { href: "/admin", icon: <Shield size={18} />, label: "Admin Panel", requiresRole: "Admin" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="h-full w-64 bg-slate-900 border-r border-slate-700 shadow-lg overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 md:px-6 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">
            Silva
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Close button for mobile */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            Navigation
          </div>
          <nav className="space-y-1 mt-3">
            {navItems.map((item) => {
              // Check permission-based access
              if (item.requiresPermission && !permissions[item.requiresPermission as keyof typeof permissions]) {
                return null;
              }
              // Check role-based access (for Admin Panel)
              if ('requiresRole' in item && item.requiresRole && permissions.role !== item.requiresRole) {
                return null;
              }
              
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onClose} // Close sidebar on mobile when navigating
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    active 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
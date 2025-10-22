import { Link, useLocation } from "react-router-dom";
import { Home, FileText, Users, Building, Contact, LifeBuoy, ClipboardList, Shield } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

const Sidebar = () => {
  const location = useLocation();
  const permissions = usePermissions();

  const navItems = [
    { href: "/", icon: <Home size={20} />, label: "Dashboard" },
    { href: "/data", icon: <Building size={20} />, label: "Company Data" },
    { href: "/contacts", icon: <Contact size={20} />, label: "Contacts" },
    { href: "/tasks", icon: <ClipboardList size={20} />, label: "Tasks" },
    { href: "/tickets", icon: <LifeBuoy size={20} />, label: "Tickets" },
    { href: "/users", icon: <Users size={20} />, label: "Users", requiresPermission: "canManageUsers" },
    { href: "/admin", icon: <Shield size={20} />, label: "Admin Panel", requiresRole: "Admin" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <aside className="flex w-64 flex-col bg-gray-800 text-white dark:bg-gray-950 dark:border-r dark:border-gray-800">
      <div className="flex h-16 items-center justify-center border-b border-gray-700 dark:border-gray-800">
        <FileText size={24} />
        <h1 className="ml-2 text-xl font-bold">CRM</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul>
          {navItems.map((item) => {
            // Check permission-based access
            if (item.requiresPermission && !permissions[item.requiresPermission as keyof typeof permissions]) {
              return null;
            }
            // Check role-based access (for Admin Panel)
            if ('requiresRole' in item && item.requiresRole && permissions.role !== item.requiresRole) {
              return null;
            }
            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={`flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-gray-700 text-white dark:bg-gray-800"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                  }`}
                >
                  {item.icon}
                  <span className="ml-4">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
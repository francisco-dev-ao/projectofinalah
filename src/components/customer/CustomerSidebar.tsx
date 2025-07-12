
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navigationItems } from "./navigation";

const CustomerSidebar = () => {
  const location = useLocation();

  // Check if the current path is active
  const isActive = (path: string) => {
    if (path === '/customer' && location.pathname === '/customer') {
      return true;
    }
    if (path !== '/customer') {
      return location.pathname.startsWith(path);
    }
    return false;
  };

  return (
    <aside className={cn(
      "bg-white w-64 border-r border-gray-200 shadow-md hidden lg:block",
      "transition-all duration-300 ease-in-out fixed z-40 inset-y-0 left-0"
    )}>
      <nav className="flex flex-col h-full py-8">
        <div className="px-4 space-y-1.5">
          {navigationItems.map((item) => (
            <Link 
              key={item.href} 
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                "hover:bg-gray-50 group relative overflow-hidden",
                isActive(item.href) 
                  ? "bg-primary/5 text-primary font-medium shadow-sm border border-primary/10" 
                  : "text-gray-700 hover:translate-x-1"
              )}
            >
              <div className={cn(
                "absolute inset-0 opacity-0 bg-gradient-to-r from-primary/5 to-indigo-500/5",
                isActive(item.href) && "opacity-100"
              )}></div>
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                isActive(item.href) ? "text-primary" : "text-gray-500 group-hover:text-primary/80",
                "group-hover:scale-110"
              )} />
              <span className="relative z-10">{item.title}</span>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default CustomerSidebar;

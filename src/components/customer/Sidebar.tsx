
import { cn } from "@/lib/utils";
import { navigationItems } from "./navigation";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

export const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/customer') {
      return location.pathname === '/customer';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="bg-white w-64 border-r border-gray-200 shadow-md h-full flex flex-col">
      {/* Logo section */}
      <div className="p-6 border-b">
        <Link to="/" className="flex items-center">
          <img 
            src="/ANGOHOST-01.png" 
            alt="AngoHost Logo" 
            className="h-8 w-auto" 
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <div className="px-4 space-y-1.5">
          {navigationItems.map((item) => (
            <Link 
              key={item.href} 
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-200",
                "hover:bg-gray-50 group relative overflow-hidden",
                isActive(item.href) 
                  ? "bg-primary/5 text-primary font-medium shadow-sm border border-primary/10" 
                  : "text-gray-700"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0",
                isActive(item.href) ? "text-primary" : "text-gray-500 group-hover:text-primary/80"
              )} />
              <span className="relative z-10">{item.title}</span>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
};

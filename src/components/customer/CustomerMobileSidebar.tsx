import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigationItems } from "./navigation";

interface CustomerMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isActive: (path: string) => boolean;
}

const CustomerMobileSidebar = ({ isOpen, onClose, isActive }: CustomerMobileSidebarProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      ></div>
      
      {/* Sidebar panel */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl border-r overflow-y-auto transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-indigo-500/5">
          <h2 className="font-semibold text-lg text-primary">Menu</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="hover:bg-primary/10 transition-all duration-200"
          >
            <X size={18} />
          </Button>
        </div>

        <nav className="flex flex-col py-6">
          <div className="px-4 space-y-1.5">
            {navigationItems.map((item) => (
              <Link 
                key={item.href} 
                to={item.href}
                onClick={onClose}
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

          <div className="mt-8 px-4 pt-6 border-t space-y-3">
            <Link to="/" className="block w-full">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full rounded-xl border-primary/20 hover:bg-primary/5 transition-all duration-200"
              >
                Ir para o site
              </Button>
            </Link>
            <Link to="/login" className="block w-full">
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white hover:shadow-md transition-all duration-200"
              >
                Sair
              </Button>
            </Link>
          </div>
        </nav>
      </aside>
    </div>
  );
};

export default CustomerMobileSidebar;

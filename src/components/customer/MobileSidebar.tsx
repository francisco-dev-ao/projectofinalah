
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navigationItems } from "./navigation";

export const MobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

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
    <>
      {/* Fixed header for mobile */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center justify-between px-4 z-40 lg:hidden">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsOpen(true)}
          className="p-2"
        >
          <Menu size={20} />
        </Button>
        <Link to="/" className="flex items-center">
          <img 
            src="/ANGOHOST-01.png" 
            alt="AngoHost Logo" 
            className="h-8 w-auto" 
          />
        </Link>
        <div className="w-10"></div>
      </div>
      {/* Mobile overlay and sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-[80vw] max-w-xs sm:max-w-sm bg-white shadow-xl border-r overflow-y-auto animate-slide-in-right rounded-r-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg text-primary">Menu</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="hover:bg-primary/10"
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
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                      "hover:bg-gray-50 group relative overflow-hidden",
                      isActive(item.href) 
                        ? "bg-primary/5 text-primary font-medium shadow-sm border border-primary/10" 
                        : "text-gray-700"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 shrink-0",
                      isActive(item.href) ? "text-primary" : "text-gray-500"
                    )} />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

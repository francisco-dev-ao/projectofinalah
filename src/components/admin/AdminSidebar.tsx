import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sidebarNavItems, type NavItem } from '@/components/admin/sidebar-nav';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LucideIcon } from 'lucide-react';

interface AdminSidebarProps {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
}

export function AdminSidebar({ showSidebar, setShowSidebar }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Você saiu com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao sair');
    }
  };

  return (
    <>
      {/* Overlay for mobile when sidebar is shown */}
      {showSidebar && (
        <div 
          className="fixed inset-0 z-10 bg-black/50 lg:hidden" 
          onClick={() => setShowSidebar(false)}
        ></div>
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex h-full w-[85%] sm:w-72 md:w-64 flex-col border-r bg-background transition-transform duration-300 lg:static lg:translate-x-0",
          showSidebar ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center border-b px-3 sm:px-4">
          <Link 
            to="/admin" 
            className="flex items-center gap-2 font-semibold"
            onClick={() => setShowSidebar(false)}
          >
            <img src="/oficial.png" alt="Logo" className="h-6 sm:h-8 w-auto" />
            <span className="text-sm sm:text-base truncate">Admin Dashboard</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 sm:right-4 top-3 lg:hidden"
            onClick={() => setShowSidebar(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <ScrollArea className="flex-1 overflow-auto py-2">
          <nav className="grid gap-1 px-2">
            {sidebarNavItems.map((item: NavItem, index) => {
              const IconComponent = item.icon as LucideIcon;
              return (
                <Link
                  key={index}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-xs sm:text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    location.pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                  onClick={() => setShowSidebar(false)}
                >
                  {IconComponent && <IconComponent className="h-4 w-4 flex-shrink-0" />}
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="mt-auto border-t p-3 sm:p-4">
          <Button
            variant="outline"
            className="w-full text-xs sm:text-sm"
            onClick={handleSignOut}
          >
            Sair
          </Button>
        </div>
      </div>
    </>
  );
}
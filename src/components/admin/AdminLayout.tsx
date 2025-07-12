import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string; // Make title optional
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <AdminSidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
        <div className="flex flex-1 flex-col w-full">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 sm:gap-4 border-b bg-background px-2 sm:px-4 lg:h-[60px]">
            <Button
              variant="outline"
              size="icon"
              aria-label="Toggle Menu"
              className="lg:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
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
                className="h-5 w-5"
              >
                <line x1="4" x2="20" y1="12" y2="12"></line>
                <line x1="4" x2="20" y1="6" y2="6"></line>
                <line x1="4" x2="20" y1="18" y2="18"></line>
              </svg>
              <span className="sr-only">Toggle Menu</span>
            </Button>
            <div className="w-full flex-1">
              <h1 className="text-lg sm:text-xl font-bold truncate">{title || 'Admin Dashboard'}</h1>
            </div>
          </header>
          <main className="flex-1 p-2 sm:p-3 md:p-4 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}

export type { AdminLayoutProps };

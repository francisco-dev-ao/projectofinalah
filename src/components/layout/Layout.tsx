
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container px-2 sm:px-4 md:px-6 lg:px-8 mx-auto py-6 w-full max-w-7xl">
        {children}
      </main>
    </div>
  );
}

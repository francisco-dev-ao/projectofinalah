
import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row w-full">
        <aside className="w-full lg:w-64 bg-white shadow-sm border-b lg:border-b-0 lg:border-r">
          <div className="p-6">
            <h2 className="text-lg font-semibold">Admin Panel</h2>
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-6 max-w-full w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

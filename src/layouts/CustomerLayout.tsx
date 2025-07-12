
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/customer/Sidebar";
import { MobileSidebar } from "@/components/customer/MobileSidebar";

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <MobileSidebar />
      </div>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-50">
        <Sidebar />
      </div>
      {/* Main content */}
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">
          <div className="px-2 sm:px-4 py-6 lg:px-8 w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

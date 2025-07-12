
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/admin-auth';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

const SuperAdminRoute = ({ children }: SuperAdminRouteProps) => {
  const { isAuthenticated, isLoading, profile } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if the user is a super_admin
  if (profile?.role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default SuperAdminRoute;

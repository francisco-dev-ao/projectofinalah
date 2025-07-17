
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense, ReactNode } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminRoute from '@/components/auth/AdminRoute';

import { publicRoutes } from './publicRoutes';
import { adminRoutes } from './adminRoutes';
import { customerRoutes } from './customerRoutes';

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="min-h-screen flex justify-center items-center">
    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

// Lazy load pages for better performance
const NotFound = lazy(() => import('@/pages/NotFound'));
const SharedInvoiceView = lazy(() => import('@/pages/SharedInvoiceView'));
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'));
const TermsDomainAO = lazy(() => import('@/pages/TermsDomainAO'));
const TermsOfUse = lazy(() => import('@/pages/TermsOfUse'));

// Wrap lazy components with Suspense
const lazyLoad = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoadingFallback />}>
    <Component />
  </Suspense>
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      {publicRoutes}
      
      {/* Shared invoice route - publicly accessible */}
      <Route path="/invoices/shared/:token" element={lazyLoad(SharedInvoiceView)} />
      
      {/* Subscription Page - publicly accessible */}
      <Route path="/hospedagem/assinatura/:planId" element={lazyLoad(SubscriptionPage)} />
      
      {/* Terms and conditions pages - publicly accessible */}
      <Route path="/termos-dominios-ao" element={lazyLoad(TermsDomainAO)} />
      <Route path="/termos-uso" element={lazyLoad(TermsOfUse)} />
      
      {/* Customer Routes - Protected with the CustomerLayout */}
      <Route 
        path="/customer" 
        element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }
      >
        {customerRoutes}
      </Route>
      
      {/* Admin Routes - non-superadmin */}
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <Outlet />
          </AdminRoute>
        }
      >
        {adminRoutes}
      </Route>
      
      {/* 404 Not Found */}
      <Route path="*" element={lazyLoad(NotFound)} />
    </Routes>
  );
}


import React from 'react';
import { Route, Navigate } from "react-router-dom";

import AdminRoute from "../components/auth/AdminRoute";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import OrderManagement from "../pages/admin/OrderManagement";
import UsersManagement from "../pages/admin/UsersManagement";
import HostingManagement from "../pages/admin/HostingManagement";
import PriceManagement from "../pages/admin/PriceManagement";
import CompanySettings from "../pages/admin/CompanySettings";
import SecurityManagement from "../pages/admin/SecurityManagement";

import UserCleanup from "../pages/admin/UserCleanup";
import PaymentsPage from "../pages/admin/PaymentsPage";
import EmailSettings from "../pages/admin/EmailSettings";
import InvoicesManagement from "../pages/admin/InvoicesManagement";
import InvoiceDetails from "../pages/admin/InvoiceDetails";
import DataCleanup from "../pages/admin/DataCleanup";
import EmailOrdersManagement from "../pages/admin/EmailOrdersManagement";
import DomainsManagement from "../pages/admin/DomainsManagement";
import DomainEdit from "../pages/admin/DomainEdit";
import ServicesManagement from "../pages/admin/ServicesManagement";
import BulkManagement from "../pages/admin/BulkManagement";
import MulticaixaReferenceManagement from "../pages/admin/MulticaixaReferenceManagement";
import ContentManagement from "../pages/admin/ContentManagement";

/**
 * Admin routes configuration
 */
export const adminRoutes = [
  // Standard admin routes (access: admin, super-admin)
  <Route 
    key="/admin" 
    path="/admin" 
    element={
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/orders" 
    path="/admin/orders" 
    element={
      <AdminRoute>
        <OrderManagement />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/services" 
    path="/admin/services" 
    element={
      <AdminRoute>
        <ServicesManagement />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/payments" 
    path="/admin/payments" 
    element={
      <AdminRoute>
        <PaymentsPage />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/invoices" 
    path="/admin/invoices" 
    element={
      <AdminRoute>
        <InvoicesManagement />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/bulk-management" 
    path="/admin/bulk-management" 
    element={
      <AdminRoute>
        <BulkManagement />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/users" 
    path="/admin/users" 
    element={
      <AdminRoute>
        <UsersManagement />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/hosting" 
    path="/admin/hosting" 
    element={
      <AdminRoute>
        <HostingManagement />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/email-orders" 
    path="/admin/email-orders" 
    element={
      <AdminRoute>
        <EmailOrdersManagement />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/domains" 
    path="/admin/domains" 
    element={
      <AdminRoute>
        <DomainsManagement />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/domains/edit/:domainId" 
    path="/admin/domains/edit/:domainId" 
    element={
      <AdminRoute>
        <DomainEdit />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/pricing" 
    path="/admin/pricing" 
    element={
      <AdminRoute>
        <PriceManagement />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/prices" 
    path="/admin/prices" 
    element={<Navigate to="/admin/pricing" replace />}
  />,
  <Route 
    key="/admin/settings" 
    path="/admin/settings" 
    element={
      <AdminRoute>
        <CompanySettings />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/email"
    path="/admin/email"
    element={<Navigate to="/admin/email-settings" replace />}
  />,
  <Route 
    key="/admin/email-settings" 
    path="/admin/email-settings" 
    element={
      <AdminRoute>
        <EmailSettings />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/security" 
    path="/admin/security" 
    element={
      <AdminRoute>
        <SecurityManagement />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/multicaixa-references" 
    path="/admin/multicaixa-references" 
    element={
      <AdminRoute>
        <MulticaixaReferenceManagement />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/content-management" 
    path="/admin/content-management" 
    element={
      <AdminRoute>
        <ContentManagement />
      </AdminRoute>
    } 
  />,
  
  
  // Admin routes (access: admin, super-admin)
  <Route 
    key="/admin/cleanup" 
    path="/admin/cleanup" 
    element={
      <AdminRoute>
        <UserCleanup />
      </AdminRoute>
    } 
  />,
  <Route 
    key="/admin/data-cleanup" 
    path="/admin/data-cleanup" 
    element={
      <AdminRoute>
        <DataCleanup />
      </AdminRoute>
    } 
  />
];

export default adminRoutes;

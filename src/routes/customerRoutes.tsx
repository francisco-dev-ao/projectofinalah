import React from 'react';
import { Route } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";

// Customer Page Components
import CustomerDashboard from "../pages/customer/CustomerDashboard";
import CustomerProfile from "../pages/customer/CustomerProfile";
import CustomerFiscalData from "../pages/customer/CustomerFiscalData";
import CustomerOrders from "../pages/customer/CustomerOrders";
import OrderDetails from "../pages/customer/OrderDetails";
import CustomerServices from "../pages/customer/CustomerServices";
import CustomerDomains from "../pages/customer/CustomerDomains";
import CustomerSettings from "../pages/customer/CustomerSettings";
import CustomerInvoices from "../pages/customer/CustomerInvoices";
import InvoiceDetails from "../pages/customer/InvoiceDetails";
import DomainDetails from "../pages/customer/DomainDetails";
import DomainRenewal from "../pages/customer/DomainRenewal";
import ServiceDetails from "../pages/customer/ServiceDetails";
import CustomerWallet from "../pages/customer/CustomerWallet";
import ContactProfiles from "../pages/customer/ContactProfiles";

/**
 * Customer routes configuration - all these routes require authentication and use CustomerLayout
 */
export const customerRoutes = (
  <Route element={<CustomerLayout />}>
    <Route index element={<CustomerDashboard />} />
    <Route path="profile" element={<CustomerProfile />} />
    <Route path="fiscal" element={<CustomerFiscalData />} />
    <Route path="orders" element={<CustomerOrders />} />
    <Route path="orders/:orderId" element={<OrderDetails />} />
    <Route path="invoices" element={<CustomerInvoices />} />
    <Route path="invoices/:id" element={<InvoiceDetails />} />
    <Route path="services" element={<CustomerServices />} />
    <Route path="services/:serviceId" element={<ServiceDetails />} />
    <Route path="domains" element={<CustomerDomains />} />
    <Route path="domains/:domainId" element={<DomainDetails />} />
    <Route path="domains/:domainId/renew" element={<DomainRenewal />} />
    <Route path="contact-profiles" element={<ContactProfiles />} />
    <Route path="wallet" element={<CustomerWallet />} />
    <Route path="settings" element={<CustomerSettings />} />
  </Route>
);

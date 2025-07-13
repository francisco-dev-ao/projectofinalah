
import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import Index from '@/pages/Index';

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="min-h-screen flex justify-center items-center">
    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

// Wrap lazy components with Suspense
const lazyLoad = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoadingFallback />}>
    <Component />
  </Suspense>
);

// Lazy load components
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ContactoPage = lazy(() => import('@/pages/ContactoPage'));
const DominiosPage = lazy(() => import('@/pages/DominiosPage'));
const HospedagemPage = lazy(() => import('@/pages/HospedagemPage'));
const EmailPage = lazy(() => import('@/pages/EmailPage'));
const ExchangePage = lazy(() => import('@/pages/ExchangePage'));
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const OrderSuccess = lazy(() => import('@/pages/OrderSuccess'));
const OrderFailed = lazy(() => import('@/pages/OrderFailed'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const OrderDetails = lazy(() => import('@/pages/OrderDetails'));
const SharedInvoiceView = lazy(() => import('@/pages/SharedInvoiceView'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));

export const publicRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={lazyLoad(AuthPage)} />
    <Route path="/login" element={lazyLoad(LoginPage)} />
    <Route path="/register" element={lazyLoad(RegisterPage)} />
    <Route path="/contacto" element={lazyLoad(ContactoPage)} />
    <Route path="/dominios" element={lazyLoad(DominiosPage)} />
    <Route path="/hospedagem" element={lazyLoad(HospedagemPage)} />
    <Route path="/email" element={lazyLoad(EmailPage)} />
    <Route path="/exchange" element={lazyLoad(ExchangePage)} />
    <Route path="/cart" element={lazyLoad(CartPage)} />
    <Route path="/checkout" element={lazyLoad(CheckoutPage)} />
    <Route path="/order-success/:orderId" element={lazyLoad(OrderSuccess)} />
    <Route path="/order-failed" element={lazyLoad(OrderFailed)} />
    <Route path="/order/:id" element={lazyLoad(OrderDetails)} />
    <Route path="/subscription/:planType/:planId" element={lazyLoad(SubscriptionPage)} />
    <Route path="/invoices/shared/:token" element={lazyLoad(SharedInvoiceView)} />
    <Route path="/reset-password" element={lazyLoad(ResetPasswordPage)} />
  </>
);

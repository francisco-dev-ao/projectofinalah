
import React from 'react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { useAuth } from '@/contexts/AuthContext';
import UnpaidInvoicesList from '@/components/customer/UnpaidInvoicesList';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">
            Bem-vindo(a), {user?.user_metadata?.name || 'Cliente'}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie seus serviços e pedidos a partir da sua área de cliente.
          </p>
        </div>

        {/* Unpaid Invoices Section */}
        {user && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <UnpaidInvoicesList userId={user.id} />
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Serviços Ativos</h3>
            <p className="text-2xl font-bold text-gray-900">-</p>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Faturas Pendentes</h3>
            <p className="text-2xl font-bold text-yellow-600">-</p>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Último Pagamento</h3>
            <p className="text-2xl font-bold text-green-600">-</p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default Dashboard;

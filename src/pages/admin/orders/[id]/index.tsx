
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrderDetailsPage() {
  const { id: orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPaymentStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'paid': 'Pago',
      'pending': 'Pendente',
      'failed': 'Falhou'
    };
    return statusMap[status] || status;
  };

  const formatPaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      'multicaixa': 'Multicaixa',
      'bank_transfer': 'Transferência Bancária'
    };
    return methodMap[method] || method;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div>Carregando...</div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div>Pedido não encontrado</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedido #{order.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p><strong>Status:</strong> {formatPaymentStatus(order.status)}</p>
                <p><strong>Total:</strong> {order.total_amount}</p>
              </div>
              <div>
                <p><strong>Método de Pagamento:</strong> {formatPaymentMethod(order.payment_method)}</p>
                <p><strong>Data:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

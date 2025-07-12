import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './PrintTemplates.module.css';

interface OrderPrintTemplateProps {
  order: any;
}

// Componente de impressão de pedido usando React
const OrderPrintTemplate = forwardRef<HTMLDivElement, OrderPrintTemplateProps>((props, ref) => {
  const { order } = props;
  
  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return `KZ ${new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(value)}`;
  };
  
  // Função para formatar status
  const formatStatus = (status: string) => {
    if (!status) return '';
    
    const statusMap: Record<string, string> = {
      'draft': 'Rascunho',
      'pending': 'Pendente',
      'processing': 'Em Processamento',
      'completed': 'Concluído',
      'canceled': 'Cancelado'
    };
    
    return statusMap[status.toLowerCase()] || status;
  };
  
  return (
    <div ref={ref} className={styles.printContainer}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <img src="/ANGOHOST-01.png" alt="AngoHost Logo" />
        </div>
        <div className={styles.documentNumber}>
          <h2>PEDIDO</h2>
          <p>Nº: {order.order_number || order.id}</p>
          <p>Emitido: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>
      </div>
      
      <hr className={styles.divider} />
      
      {/* Informações da Empresa */}
      <div className={styles.companyInfo}>
        <h3>AngoHost</h3>
        <p>Luanda, Angola</p>
        <p>NIF: 5000088927</p>
        <p>support@angohost.ao</p>
        <p>+244 942 090108</p>
      </div>
      
      {/* Informações do Cliente */}
      <div className={styles.customerInfo}>
        <h3>Cliente:</h3>
        <p>{order.profiles?.name || order.profiles?.company_name || ''}</p>
        {order.profiles?.email && <p>Email: {order.profiles.email}</p>}
        {order.profiles?.phone && <p>Tel: {order.profiles.phone}</p>}
        {order.profiles?.nif && <p>NIF: {order.profiles.nif}</p>}
      </div>
      
      {/* Detalhes do Pedido */}
      <div className={styles.documentDetails}>
        <p>Data: {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        <p>Status: {formatStatus(order.status)}</p>
      </div>
      
      {/* Tabela de Itens */}
      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Qtd</th>
            <th>Preço Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {(order.order_items || []).map((item: any, index: number) => (
            <tr key={index}>
              <td>{item.product_name || 'Produto'}</td>
              <td>{item.quantity || 1}</td>
              <td>{formatCurrency(item.price || 0)}</td>
              <td>{formatCurrency((item.quantity || 1) * (item.price || 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Totais */}
      <div className={styles.totals}>
        <div className={styles.total}>
          <span>Total:</span>
          <span>{formatCurrency(order.total_amount || 0)}</span>
        </div>
      </div>
      
      {/* Carimbo e Assinatura */}
      <div className={styles.stampSignature}>
        <img src="/lovable-uploads/e588f3a2-9ad0-463d-8c9f-2d2eebebc765.png" alt="Carimbo" />
      </div>
      
      {/* Rodapé */}
      <div className={styles.footer}>
        <hr className={styles.divider} />
        <p>AngoHost - {new Date().getFullYear()}</p>
        <p>Este documento foi gerado eletronicamente e é válido sem assinatura.</p>
      </div>
    </div>
  );
});

OrderPrintTemplate.displayName = 'OrderPrintTemplate';

export default OrderPrintTemplate;

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './InvoicePrintTemplate.module.css';
import { extractServiceDescription } from '@/utils/invoice/serviceDescriptionExtractor';

interface InvoicePrintTemplateProps {
  invoice: any;
}

// Componente de impressão de fatura usando React (substitui jsPDF)
const InvoicePrintTemplate = forwardRef<HTMLDivElement, InvoicePrintTemplateProps>((props, ref) => {
  const { invoice } = props;
  
  // Buscar os dados completos da referência de pagamento mais recente
  const latestPaymentRef = invoice.orders?.payment_references && invoice.orders.payment_references.length > 0
    ? invoice.orders.payment_references
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;
  
  // Extrair dados da referência
  const paymentReference = invoice.payment_reference || latestPaymentRef?.reference || 'Pendente';
  const paymentEntity = invoice.payment_entity || latestPaymentRef?.entity || '11333';
  const paymentAmount = invoice.amount || latestPaymentRef?.amount || 0;
  const paymentDescription = latestPaymentRef?.description || invoice.description || 'Pagamento de serviços';
  const validityDate = latestPaymentRef?.validity_date 
    ? new Date(latestPaymentRef.validity_date)
    : new Date(Date.now() + 2 * 86400000); // 2 dias se não tiver
  const validityDays = latestPaymentRef?.validity_days || 2;
  
  // Instruções de pagamento
  const paymentInstructions = latestPaymentRef?.appypay_response?.instructions?.pt || {
    title: "Como pagar por referência",
    steps: [
      "Dirija-se a um ATM, Internet Banking ou Multicaixa Express",
      "Selecione \"Pagamentos\" e depois \"Outros Serviços\"",
      `Insira a Entidade: ${paymentEntity}`,
      `Insira a Referência: ${paymentReference}`,
      `Confirme o valor: ${paymentAmount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} AOA`,
      "Confirme o pagamento"
    ],
    note: `Esta referência é válida até ${validityDate.toLocaleDateString('pt-PT')}`
  };
  
  // Preparar itens da fatura
  const items = invoice.orders?.order_items && invoice.orders.order_items.length > 0
    ? invoice.orders.order_items
    : [{
        name: 'Serviço',
        description: invoice.description || 'Serviço de hospedagem',
        quantity: 1,
        unit_price: invoice.amount || 0
      }];
  
  // Calcular totais
  const subtotal = items.reduce((acc, item) => 
    acc + ((item.quantity || 1) * (item.unit_price || item.price || 0)), 0);
  const total = invoice.amount || subtotal;
  
  // Função para formatar moeda
  const formatCurrency = (value) => {
    return `KZ ${new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(value)}`;
  };
  
  // Função para formatar status
  const formatStatus = (status) => {
    if (!status) return '';
    
    const statusMap = {
      'draft': 'Rascunho',
      'issued': 'Emitida',
      'paid': 'Paga',
      'canceled': 'Cancelada'
    };
    
    return statusMap[status.toLowerCase()] || status;
  };
  
  // Não precisamos mais verificar se há referência de pagamento válida
  // pois agora lidamos com isso de forma mais elegante no template
  
  return (
    <div ref={ref} className={styles.printContainer}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <img src="/ANGOHOST-01.png" alt="AngoHost Logo" />
        </div>
        <div className={styles.invoiceNumber}>
          <h2>Nº: {invoice.invoice_number || ''}</h2>
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
        <p>{invoice.orders?.profiles?.name || invoice.orders?.profiles?.company_name || ''}</p>
        {invoice.orders?.profiles?.email && <p>Email: {invoice.orders.profiles.email}</p>}
        {invoice.orders?.profiles?.phone && <p>Tel: {invoice.orders.profiles.phone}</p>}
        {invoice.orders?.profiles?.nif && <p>NIF: {invoice.orders.profiles.nif}</p>}
      </div>
      
      {/* Detalhes da Fatura */}
      <div className={styles.invoiceDetails}>
        <p>Data: {format(new Date(invoice.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        <p>Vencimento: {format(new Date(invoice.due_date || new Date()), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        <p>Status: {formatStatus(invoice.status)}</p>
      </div>
      
      {/* Tabela de Itens */}
      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th>Serviço/Produto</th>
            <th>Qtd</th>
            <th>Preço Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{extractServiceDescription(item)}</td>
              <td>{item.quantity || 1}</td>
              <td>{formatCurrency(item.unit_price || item.price || 0)}</td>
              <td>{formatCurrency((item.quantity || 1) * (item.unit_price || item.price || 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Totais */}
      <div className={styles.totals}>
        <div className={styles.subtotal}>
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className={styles.total}>
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      
      {/* Detalhes de Pagamento */}
      <div className={styles.paymentDetails}>
        <h3>Pagamento por Referência Multicaixa</h3>
        <div className={styles.paymentInfo}>
          <div className={styles.paymentRow}>
            <span className={styles.paymentLabel}>Entidade:</span>
            <span className={styles.paymentValue}>{paymentEntity}</span>
          </div>
          <div className={styles.paymentRow}>
            <span className={styles.paymentLabel}>Referência:</span>
            <span className={styles.paymentValue}>{paymentReference}</span>
          </div>
          <div className={styles.paymentRow}>
            <span className={styles.paymentLabel}>Valor:</span>
            <span className={styles.paymentValue}>{formatCurrency(paymentAmount)}</span>
          </div>
          <div className={styles.paymentRow}>
            <span className={styles.paymentLabel}>Descrição:</span>
            <span className={styles.paymentValue}>{paymentDescription}</span>
          </div>
          <div className={styles.paymentRow}>
            <span className={styles.paymentLabel}>Validade:</span>
            <span className={styles.paymentValue}>{validityDate.toLocaleDateString('pt-PT')}</span>
          </div>
          <div className={styles.paymentRow}>
            <span className={styles.paymentLabel}>Dias de validade:</span>
            <span className={styles.paymentValue}>{validityDays} dias</span>
          </div>
        </div>
        
        <div className={styles.paymentInstructions}>
          <h4>{paymentInstructions.title}</h4>
          <ol>
            {paymentInstructions.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          <p className={styles.paymentNote}>{paymentInstructions.note}</p>
        </div>
        
        <p className={styles.supportNote}>
          Para dúvidas, contacte o nosso suporte: support@angohost.ao
        </p>
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

InvoicePrintTemplate.displayName = 'InvoicePrintTemplate';

export default InvoicePrintTemplate;

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import InvoicePrintTemplate from '@/components/invoice/InvoicePrintTemplate';
import OrderPrintTemplate from '@/components/order/OrderPrintTemplate';
import ServicePrintTemplate from '@/components/service/ServicePrintTemplate';
import { supabase } from '@/integrations/supabase/client';


// Constantes para uso nos métodos client-side
const API_URL = '/api/email';

/**
 * Hook para usar o componente de impressão de fatura
 * Este é um hook real que deve ser usado dentro de componentes React
 */
const usePrintInvoice = (invoice: any) => {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    // Método seguro que não usa hooks
    if (invoice) {
      window.open(`/invoices/preview/${invoice.id}`, '_blank');
    }
  };
  
  const PrintComponent = () => (
    <div ref={componentRef}>
      <InvoicePrintTemplate invoice={invoice} />
    </div>
  );
  
  return {
    PrintComponent,
    handlePrint,
    componentRef
  };
};

/**
 * Utilitário para verificar se um documento tem uma referência de pagamento válida
 */
const hasValidPaymentReference = (document: any): boolean => {
  if (document.payment_reference) {
    return true;
  }
  
  const order = document.orders || document;
  
  if (!order.payment_references || order.payment_references.length === 0) {
    return false;
  }
  
  // Verificar se há pelo menos uma referência de pagamento válida
  return order.payment_references.some((ref: any) => ref.reference && ref.reference.trim() !== '');
};

/**
 * Obtém a referência de pagamento mais recente de um documento
 */
const getLatestPaymentReference = (document: any): string => {
  const order = document.orders || document;
  
  if (!order.payment_references || order.payment_references.length === 0) {
    return '';
  }
  
  // Ordenar as referências pela data de criação (mais recentes primeiro)
  const sortedRefs = [...order.payment_references].sort((a: any, b: any) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  // Retornar a referência mais recente
  return sortedRefs[0]?.reference || '';
};

/**
 * Atualiza a referência de pagamento de uma fatura
 */
const updateInvoiceReference = async (invoice: any, requireReference = true): Promise<any> => {
  if (invoice.payment_reference) {
    return invoice;
  }
  
  // Se já há referência na fatura, usa ela
  if (hasValidPaymentReference(invoice)) {
    const latestRef = getLatestPaymentReference(invoice);
    return { ...invoice, payment_reference: latestRef };
  }
  
  // Se a referência é obrigatória e não tem, lança erro
  if (requireReference) {
    throw new Error('Referência de pagamento não encontrada');
  }
  
  // Se a referência não é obrigatória, retorna a fatura sem alteração
  return invoice;
};

/**
 * Imprime uma fatura diretamente usando a janela de impressão do navegador
 * Essa é uma abordagem mais segura que não viola as regras de hooks do React
 */
const printInvoice = async (invoice: any, requireReference = true): Promise<void> => {
  try {
    // Atualizar a referência de pagamento, se necessário
    const updatedInvoice = await updateInvoiceReference(invoice, requireReference);

    // Gerar PDF na mesma página e abrir o visualizador do navegador
    const pdfBuffer = await generateInvoicePDF(updatedInvoice, requireReference);
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.location.href = url;
  } catch (error) {
    console.error('Erro ao imprimir fatura:', error);
    throw error;
  }
};

/**
 * Gera um PDF da fatura
 */


import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
const generateInvoicePDF = async (invoice: any, requireReference = true): Promise<Buffer> => {
  try {
    // Atualizar a referência de pagamento, se necessário
    const updatedInvoice = await updateInvoiceReference(invoice, requireReference);

    // Criar um container temporário para renderizar a fatura em HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm';
    container.style.background = '#fff';
    document.body.appendChild(container);

    // Gerar HTML da fatura (usando o mesmo layout do InvoicePrintTemplate)
    container.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 32px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <img src='/ANGOHOST-01.png' alt='AngoHost Logo' style='height: 48px;'/>
          <div>
            <h2 style='margin: 0;'>Nº: ${updatedInvoice.invoice_number || ''}</h2>
            <p style='margin: 0;'>Emitido: ${(new Date()).toLocaleString('pt-PT')}</p>
          </div>
        </div>
        <hr style='margin: 24px 0;' />
        <div>
          <h3>AngoHost</h3>
          <p>Luanda, Angola</p>
          <p>NIF: 5000088927</p>
          <p>support@angohost.ao</p>
          <p>+244 942 090108</p>
        </div>
        <div style='margin-top: 16px;'>
          <h3>Cliente:</h3>
          <p>${updatedInvoice.orders?.profiles?.name || updatedInvoice.orders?.profiles?.company_name || ''}</p>
          ${updatedInvoice.orders?.profiles?.email ? `<p>Email: ${updatedInvoice.orders.profiles.email}</p>` : ''}
          ${updatedInvoice.orders?.profiles?.phone ? `<p>Tel: ${updatedInvoice.orders.profiles.phone}</p>` : ''}
          ${updatedInvoice.orders?.profiles?.nif ? `<p>NIF: ${updatedInvoice.orders.profiles.nif}</p>` : ''}
        </div>
        <div style='margin-top: 16px;'>
          <p>Data: ${(new Date(updatedInvoice.created_at)).toLocaleString('pt-PT')}</p>
          <p>Vencimento: ${(new Date(updatedInvoice.due_date || new Date())).toLocaleString('pt-PT')}</p>
          <p>Status: ${updatedInvoice.status || ''}</p>
        </div>
        <table style='width: 100%; border-collapse: collapse; margin-top: 24px;'>
          <thead>
            <tr style='background: #f8f9fa;'>
              <th style='padding: 8px; border: 1px solid #eee;'>Serviço/Produto</th>
              <th style='padding: 8px; border: 1px solid #eee;'>Qtd</th>
              <th style='padding: 8px; border: 1px solid #eee;'>Preço Unit.</th>
              <th style='padding: 8px; border: 1px solid #eee;'>Total</th>
            </tr>
          </thead>
          <tbody>
            ${(updatedInvoice.orders?.order_items || [{ name: 'Serviço', quantity: 1, unit_price: updatedInvoice.amount || 0 }]).map((item: any) => `
              <tr>
                <td style='padding: 8px; border: 1px solid #eee;'>${item.name}</td>
                <td style='padding: 8px; border: 1px solid #eee;'>${item.quantity || 1}</td>
                <td style='padding: 8px; border: 1px solid #eee;'>KZ ${Number(item.unit_price || item.price || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                <td style='padding: 8px; border: 1px solid #eee;'>KZ ${Number((item.quantity || 1) * (item.unit_price || item.price || 0)).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style='margin-top: 16px; text-align: right;'>
          <div><strong>Subtotal:</strong> KZ ${((updatedInvoice.orders?.order_items || [{ quantity: 1, unit_price: updatedInvoice.amount || 0 }]).reduce((acc: number, item: any) => acc + ((item.quantity || 1) * (item.unit_price || item.price || 0)), 0)).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          <div><strong>Total:</strong> KZ ${(updatedInvoice.amount || ((updatedInvoice.orders?.order_items || [{ quantity: 1, unit_price: updatedInvoice.amount || 0 }]).reduce((acc: number, item: any) => acc + ((item.quantity || 1) * (item.unit_price || item.price || 0)), 0))).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
        </div>
        <div style='margin-top: 24px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; background-color: #f9f9f9;'>
          <h3 style='margin: 0 0 10px 0; color: #2980b9;'>Pagamento por Referência Multicaixa</h3>
          
          <div style='margin-bottom: 15px;'>
            <div style='display: flex; justify-content: space-between; margin: 5px 0;'>
              <span style='font-weight: bold; color: #2980b9; min-width: 140px;'>Entidade:</span>
              <span style='text-align: right;'>${updatedInvoice.payment_entity || (updatedInvoice.orders?.payment_references?.[0]?.entity) || '11333'}</span>
            </div>
            <div style='display: flex; justify-content: space-between; margin: 5px 0;'>
              <span style='font-weight: bold; color: #2980b9; min-width: 140px;'>Referência:</span>
              <span style='text-align: right;'>${updatedInvoice.payment_reference || (updatedInvoice.orders?.payment_references && updatedInvoice.orders.payment_references.length > 0 ? updatedInvoice.orders.payment_references.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].reference : 'Pendente')}</span>
            </div>
            <div style='display: flex; justify-content: space-between; margin: 5px 0;'>
              <span style='font-weight: bold; color: #2980b9; min-width: 140px;'>Valor:</span>
              <span style='text-align: right;'>KZ ${(updatedInvoice.orders?.total_amount || updatedInvoice.amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style='display: flex; justify-content: space-between; margin: 5px 0;'>
              <span style='font-weight: bold; color: #2980b9; min-width: 140px;'>Descrição:</span>
              <span style='text-align: right;'>${updatedInvoice.orders?.payment_references?.[0]?.description || updatedInvoice.description || 'Pagamento de serviços'}</span>
            </div>
            <div style='display: flex; justify-content: space-between; margin: 5px 0;'>
              <span style='font-weight: bold; color: #2980b9; min-width: 140px;'>Validade:</span>
              <span style='text-align: right;'>${updatedInvoice.orders?.payment_references?.[0]?.validity_date ? new Date(updatedInvoice.orders.payment_references[0].validity_date).toLocaleDateString('pt-PT') : new Date(Date.now() + 2 * 86400000).toLocaleDateString('pt-PT')}</span>
            </div>
            <div style='display: flex; justify-content: space-between; margin: 5px 0;'>
              <span style='font-weight: bold; color: #2980b9; min-width: 140px;'>Dias de validade:</span>
              <span style='text-align: right;'>${updatedInvoice.orders?.payment_references?.[0]?.validity_days || 2} dias</span>
            </div>
          </div>
          
          <div style='border-top: 1px solid #ddd; padding-top: 15px; margin-top: 15px;'>
            <h4 style='margin: 0 0 10px 0; color: #2980b9; font-size: 0.95rem;'>Como pagar por referência</h4>
            <ol style='margin: 10px 0; padding-left: 20px;'>
              <li style='margin: 5px 0; font-size: 0.85rem;'>Dirija-se a um ATM, Internet Banking ou Multicaixa Express</li>
              <li style='margin: 5px 0; font-size: 0.85rem;'>Selecione "Pagamentos" e depois "Outros Serviços"</li>
              <li style='margin: 5px 0; font-size: 0.85rem;'>Insira a Entidade: ${updatedInvoice.payment_entity || (updatedInvoice.orders?.payment_references?.[0]?.entity) || '11333'}</li>
              <li style='margin: 5px 0; font-size: 0.85rem;'>Insira a Referência: ${updatedInvoice.payment_reference || (updatedInvoice.orders?.payment_references && updatedInvoice.orders.payment_references.length > 0 ? updatedInvoice.orders.payment_references.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].reference : 'Pendente')}</li>
              <li style='margin: 5px 0; font-size: 0.85rem;'>Confirme o valor: ${(updatedInvoice.orders?.total_amount || updatedInvoice.amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} AOA</li>
              <li style='margin: 5px 0; font-size: 0.85rem;'>Confirme o pagamento</li>
            </ol>
            <p style='font-size: 0.8rem; color: #666; margin-top: 10px;'>Esta referência é válida até ${updatedInvoice.orders?.payment_references?.[0]?.validity_date ? new Date(updatedInvoice.orders.payment_references[0].validity_date).toLocaleDateString('pt-PT') : new Date(Date.now() + 2 * 86400000).toLocaleDateString('pt-PT')}</p>
          </div>
          
          <p style='font-size: 0.8rem; color: #666; margin-top: 10px;'>Para dúvidas, contacte o nosso suporte: support@angohost.ao</p>
        </div>
        <div style='margin-top: 32px; text-align: right;'>
          <img src='/lovable-uploads/e588f3a2-9ad0-463d-8c9f-2d2eebebc765.png' alt='Carimbo' style='height: 48px;'/>
        </div>
        <hr style='margin: 24px 0;' />
        <div style='text-align: center; font-size: 12px; color: #666;'>
          <p>AngoHost - ${(new Date()).getFullYear()}</p>
          <p>Este documento foi gerado eletronicamente e é válido sem assinatura.</p>
        </div>
      </div>
    `;

    // Usar html2canvas e jsPDF para converter o HTML em PDF
    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      const arrayBuffer = pdf.output('arraybuffer');
      return Buffer.from(arrayBuffer);
    } finally {
      document.body.removeChild(container);
    }
  } catch (error) {
    console.error('Erro ao gerar PDF da fatura:', error);
    throw error;
  }
};

/**
 * Hook para usar o componente de impressão de pedido
 * Este é um hook real que deve ser usado dentro de componentes React
 */
const usePrintOrder = (order: any) => {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    // Método seguro que não usa hooks
    if (order) {
      window.open(`/orders/preview/${order.id}`, '_blank');
    }
  };
  
  const PrintComponent = () => (
    <div ref={componentRef}>
      <OrderPrintTemplate order={order} />
    </div>
  );
  
  return {
    PrintComponent,
    handlePrint,
    componentRef
  };
};

/**
 * Imprime um pedido diretamente usando a janela de impressão do navegador
 */
const printOrder = async (order: any): Promise<void> => {
  try {
    // Abrir a janela de visualização de impressão
    // Esta função não usa React hooks, então é segura para usar fora de componentes
    window.open(`/orders/preview/${order.id}`, '_blank');
  } catch (error) {
    console.error('Erro ao imprimir pedido:', error);
    throw error;
  }
};

/**
 * Gera um PDF do pedido
 */
const generateOrderPDF = async (order: any): Promise<Buffer> => {
  try {
    // Similar à implementação de generateInvoicePDF, mas para pedidos
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    
    const printableElement = document.createElement('div');
    container.appendChild(printableElement);
    
    try {
      // Simular a renderização
      printableElement.innerHTML = '<div id="order-content" style="width: 210mm;"></div>';
      
      // Capturar como canvas
      const canvas = await html2canvas(printableElement, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Adicionar a imagem do canvas ao PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
      // Converter para ArrayBuffer e depois para Buffer
      const arrayBuffer = pdf.output('arraybuffer');
      return Buffer.from(arrayBuffer);
    } finally {
      document.body.removeChild(container);
    }
  } catch (error) {
    console.error('Erro ao gerar PDF do pedido:', error);
    throw error;
  }
};

/**
 * Hook para usar o componente de impressão de serviço
 * Este é um hook real que deve ser usado dentro de componentes React
 */
const usePrintService = (service: any) => {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    // Método seguro que não usa hooks
    if (service) {
      window.open(`/services/preview/${service.id}`, '_blank');
    }
  };
  
  const PrintComponent = () => (
    <div ref={componentRef}>
      <ServicePrintTemplate service={service} />
    </div>
  );
  
  return {
    PrintComponent,
    handlePrint,
    componentRef
  };
};

/**
 * Imprime um serviço diretamente usando a janela de impressão do navegador
 */
const printService = async (service: any): Promise<void> => {
  try {
    // Abrir a janela de visualização de impressão
    // Esta função não usa React hooks, então é segura para usar fora de componentes
    window.open(`/services/preview/${service.id}`, '_blank');
  } catch (error) {
    console.error('Erro ao imprimir serviço:', error);
    throw error;
  }
};

/**
 * Gera um PDF do serviço
 */
const generateServicePDF = async (service: any): Promise<Buffer> => {
  // Implementação similar a generateInvoicePDF e generateOrderPDF
  try {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    
    const printableElement = document.createElement('div');
    container.appendChild(printableElement);
    
    try {
      printableElement.innerHTML = '<div id="service-content" style="width: 210mm;"></div>';
      
      const canvas = await html2canvas(printableElement, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
      const arrayBuffer = pdf.output('arraybuffer');
      return Buffer.from(arrayBuffer);
    } finally {
      document.body.removeChild(container);
    }
  } catch (error) {
    console.error('Erro ao gerar PDF do serviço:', error);
    throw error;
  }
};

/**
 * Envia uma fatura por e-mail para o cliente usando a API
 */
const sendInvoiceByEmail = async (
  invoice: any, 
  requireReference = false,
  additionalRecipients: string[] = []
): Promise<any> => {
  try {
    // Verificar se a fatura tem cliente com e-mail
    if (!invoice.orders?.profiles?.email) {
      throw new Error('E-mail do cliente não encontrado');
    }

    // Obter PDF - se requireReference for false, pode usar 'Pendente' como referência
    const pdfBuffer = await generateInvoicePDF(invoice, requireReference);

    // Converter o buffer para Base64 para enviar na requisição
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    
    // Preparar os dados para a API
    const apiData = {
      invoiceId: invoice.id,
      requireReference,
      additionalRecipients,
      pdfBase64: base64Pdf
    };
    
    // Chamar a API de envio de e-mail
    const response = await fetch(`${API_URL}/send-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao enviar e-mail');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Erro ao enviar fatura por e-mail:', error);
    throw error;
  }
};

/**
 * Envia um pedido por e-mail para o cliente usando a API
 */
const sendOrderByEmail = async (
  order: any,
  additionalRecipients: string[] = []
): Promise<any> => {
  try {
    // Verificar se o pedido tem cliente com e-mail
    if (!order.profiles?.email) {
      throw new Error('E-mail do cliente não encontrado');
    }

    // Gerar o PDF
    const pdfBuffer = await generateOrderPDF(order);

    // Converter o buffer para Base64 para enviar na requisição
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    
    // Preparar os dados para a API
    const apiData = {
      orderId: order.id,
      additionalRecipients,
      pdfBase64: base64Pdf
    };
    
    // Chamar a API de envio de e-mail
    const response = await fetch(`${API_URL}/send-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao enviar e-mail');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Erro ao enviar pedido por e-mail:', error);
    throw error;
  }
};

/**
 * Envia um e-mail de teste para verificar a configuração SMTP
 * @param email O e-mail de destino para o teste
 * @returns Informações sobre o envio do e-mail
 */
const sendTestEmail = async (email: string): Promise<any> => {
  try {
    if (!email) {
      throw new Error('E-mail de destino não fornecido');
    }
    
    // Chamar a API de envio de e-mail de teste
    const response = await fetch(`${API_URL}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao enviar e-mail de teste');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Erro ao enviar e-mail de teste:', error);
    throw error;
  }
};

// Objeto de serviço para exportação padrão
const PrintService = {
  // Faturas
  printInvoice,
  generateInvoicePDF,
  usePrintInvoice,
  
  // Pedidos
  printOrder,
  generateOrderPDF,
  usePrintOrder,
  
  // Serviços
  printService,
  generateServicePDF,
  usePrintService,
  
  // Utilitários
  hasValidPaymentReference,
  getLatestPaymentReference,
  
  // Envio de e-mails
  sendInvoiceByEmail,
  sendOrderByEmail,
  sendTestEmail
};

// Exportar como default e também todas as funções individualmente
export {
  printInvoice,
  generateInvoicePDF,
  usePrintInvoice,
  printOrder,
  generateOrderPDF,
  usePrintOrder,
  printService,
  generateServicePDF,
  usePrintService,
  hasValidPaymentReference,
  getLatestPaymentReference,
  sendInvoiceByEmail,
  sendOrderByEmail,
  sendTestEmail,
  updateInvoiceReference // Expor esta função também
};

// Exportar o serviço como default
export default PrintService;

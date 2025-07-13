// HTML printing only - PDF generation removed

interface PaymentReference {
  entity: string;
  reference: string;
  amount: number;
  description: string;
  validity_date: string;
  validity_days: number;
  order_id: string;
  instructions: {
    pt: {
      title: string;
      steps: string[];
      note: string;
    };
  };
  payment_channels: string[];
}

/**
 * Gera um PDF apenas com os dados da referência de pagamento Multicaixa
 */
export const generatePaymentReferencePDF = async (
  paymentReference: PaymentReference,
  customerName?: string,
  customerEmail?: string,
  orderData?: any
): Promise<void> => {
  try {
    // Criar um container temporário para renderizar o documento
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm';
    container.style.background = '#fff';
    container.style.padding = '20px';
    document.body.appendChild(container);

    // Função para formatar moeda
    const formatCurrency = (value: number) => {
      return `${new Intl.NumberFormat('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(value)} AOA`;
    };

    // Função para formatar data
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString('pt-PT');
    };

    // Gerar HTML da referência de pagamento
    container.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 32px;">
        <!-- Header -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; border-bottom: 2px solid #059669; padding-bottom: 24px;">
          <div style="display: flex; align-items: center;">
            <img src='/ANGOHOST-01.png' alt='AngoHost Logo' style='height: 60px; margin-right: 20px;'/>
            <div>
              <div style="margin-top: 8px; font-size: 12px; color: #6b7280; line-height: 1.4;">
                <div><strong>NIF:</strong> 5000088927</div>
                <div><strong>Endereço:</strong> Sequele, Rua 2, Bloco 11, Prédio Nº 3, 7º Andar, Aptº701</div>
                <div><strong>Cidade:</strong> Luanda, Angola</div>
                <div><strong>Tel:</strong> +244 942 090108 | <strong>Email:</strong> support@angohost.ao</div>
              </div>
            </div>
          </div>
          <div style="text-align: center;">
            <h2 style="margin: 0; font-size: 22px; font-weight: bold; color: #059669;">PROFORMA</h2>
            <p style="margin: 2px 0; font-size: 14px; color: #6b7280;">Referência de Pagamento</p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Gerado em: ${new Date().toLocaleString('pt-PT')}</p>
            
            <!-- Carimbo Oficial da Empresa -->
            <div style="margin-top: 16px; background: white; padding: 8px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <img src="/lovable-uploads/ba004896-0785-41b5-9735-628e5e3ed660.png" alt="Carimbo AngoHost" style="height: 90px; width: auto; display: block;"/>
            </div>
          </div>
        </div>

        <!-- Customer Info -->
        ${(customerName || customerEmail) ? `
        <div style="margin-bottom: 24px; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">Dados do Cliente</h3>
          ${customerName ? `<p style="margin: 0; font-size: 14px;">Nome: ${customerName}</p>` : ''}
          ${customerEmail ? `<p style="margin: 0; font-size: 14px;">Email: ${customerEmail}</p>` : ''}
          <p style="margin: 0; font-size: 14px;">Pedido: #${paymentReference.order_id.substring(0, 8)}</p>
        </div>
        ` : ''}

        <!-- Services/Products Details -->
        ${orderData?.order_items?.length ? `
        <div style="margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 16px 0; font-weight: bold; color: #1f2937; display: flex; align-items: center;">
            <span style="color: #059669; margin-right: 8px;">📦</span>
            Serviços Solicitados
          </h3>
          <div style="background: white; border-radius: 6px; overflow: hidden; border: 1px solid #e5e7eb;">
            <div style="background: #f9fafb; padding: 12px; border-bottom: 1px solid #e5e7eb; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px; font-size: 14px; font-weight: 600; color: #374151;">
              <span>Serviço</span>
              <span style="text-align: center;">Duração</span>
              <span style="text-align: center;">Quantidade</span>
              <span style="text-align: right;">Valor</span>
            </div>
            ${orderData.order_items.map((item: any) => `
              <div style="padding: 12px; border-bottom: 1px solid #f3f4f6; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px; align-items: center;">
                <div>
                  <div style="font-weight: 500; color: #1f2937; margin-bottom: 2px;">${item.name || 'Serviço'}</div>
                  ${item.description ? `<div style="font-size: 12px; color: #6b7280;">${item.description}</div>` : ''}
                </div>
                <div style="text-align: center; font-size: 14px; color: #374151;">
                  ${item.duration ? `${item.duration} ${item.duration_unit === 'month' ? 'mês(es)' : item.duration_unit || 'período'}` : '-'}
                </div>
                <div style="text-align: center; font-size: 14px; color: #374151;">${item.quantity || 1}</div>
                <div style="text-align: right; font-weight: 500; color: #1f2937;">${formatCurrency(item.unit_price || 0)}</div>
              </div>
            `).join('') || ''}
            <div style="padding: 12px; background: #f9fafb; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px; align-items: center; font-weight: bold;">
              <span style="color: #1f2937;">Total</span>
              <span></span>
              <span></span>
              <span style="text-align: right; color: #059669; font-size: 16px;">${formatCurrency(orderData.total_amount || paymentReference.amount)}</span>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Payment Reference Details -->
        <div style="background: linear-gradient(to right, #ecfdf5, #f0fdf4); border: 2px solid #bbf7d0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <img src="/lovable-uploads/f8d6177e-8235-4942-af13-8da5c89452a9.png" alt="Multicaixa" style="height: 32px; width: 32px; margin-right: 12px;"/>
            <h3 style="margin: 0; font-size: 20px; font-weight: bold; color: #166534;">Dados para Pagamento Multicaixa</h3>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px;">
            <!-- Entidade -->
            <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #bbf7d0;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #059669;">Entidade</p>
              <p style="margin: 0; font-size: 32px; font-family: monospace; font-weight: bold; color: #166534;">${paymentReference.entity}</p>
            </div>

            <!-- Referência -->
            <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #bfdbfe;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #2563eb;">Referência</p>
              <p style="margin: 0; font-size: 32px; font-family: monospace; font-weight: bold; color: #1e40af;">${paymentReference.reference}</p>
            </div>

            <!-- Valor -->
            <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #bbf7d0;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #059669;">Valor</p>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #166534;">${formatCurrency(paymentReference.amount)}</p>
            </div>

            <!-- Validade -->
            <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #fed7aa;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #ea580c;">Válida até</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #9a3412;">${formatDate(paymentReference.validity_date)}</p>
              <p style="margin: 0; font-size: 14px; color: #ea580c;">(${paymentReference.validity_days} dias)</p>
            </div>
          </div>

        </div>

        <!-- Payment Channels -->
        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 12px 0; font-size: 18px; font-weight: bold; color: #1f2937;">
            📱 Onde Pagar
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            ${paymentReference.payment_channels.map(channel => `
              <div style="display: flex; align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px;">
                <span style="color: #2563eb; margin-right: 8px;">✓</span>
                <span style="font-weight: 500; color: #1e40af;">${channel}</span>
              </div>
            `).join('') || ''}
          </div>
        </div>

        <!-- Instructions -->
        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 12px 0; font-size: 18px; font-weight: bold; color: #1f2937;">
            📋 ${paymentReference.instructions.pt.title}
          </h4>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <ol style="margin: 0; padding-left: 20px;">
              ${paymentReference.instructions.pt.steps.map(step => `
                <li style="margin: 8px 0; font-size: 14px; color: #374151; line-height: 1.5;">${step}</li>
              `).join('') || ''}
            </ol>
            
            <div style="margin-top: 16px; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 8px;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #1e40af;">⚠️ Importante</p>
              <p style="margin: 0; font-size: 14px; color: #1d4ed8;">${paymentReference.instructions.pt.note}</p>
            </div>
          </div>
        </div>

        <!-- Final Invoice Note -->
        <div style="margin-bottom: 24px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #92400e; display: flex; align-items: center;">
            📄 Fatura Final
          </h4>
          <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
            Após o pagamento, a fatura final certificada pela AGT chegará automaticamente ao seu email após o seu pagamento.
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 2px solid #d1d5db; padding-top: 16px; text-align: center;">
          <div style="margin-bottom: 12px;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1f2937;">AngoHost, Lda</p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Luanda, Angola | NIF: 5000088927</p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Email: support@angohost.ao | Tel: +244 942 090108</p>
          </div>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            Este documento foi gerado eletronicamente - ${new Date().toLocaleString('pt-PT')}
          </p>
        </div>
      </div>
    `;

    // PDF generation removed - only HTML printing available
    try {
      console.log('PDF generation disabled, showing print dialog instead');
      window.print();
    } finally {
      document.body.removeChild(container);
    }
  } catch (error) {
    console.error('Erro ao gerar PDF da referência:', error);
    throw error;
  }
};

/**
 * Abre uma nova janela para imprimir apenas os dados da referência de pagamento
 */
export const printPaymentReference = (
  paymentReference: PaymentReference,
  customerName?: string,
  customerEmail?: string,
  orderData?: any
): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Não foi possível abrir a janela de impressão');
  }

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return `${new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(value)} AOA`;
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-PT');
  };

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Referência de Pagamento Multicaixa - ${paymentReference.reference}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; border-bottom: 2px solid #059669; padding-bottom: 16px; }
        .logo-section { display: flex; align-items: center; }
        .logo { height: 48px; margin-right: 16px; }
        .company-info h1 { margin: 0; font-size: 24px; font-weight: bold; color: #1f2937; }
        .company-info p { margin: 0; font-size: 14px; color: #6b7280; }
        .document-info { text-align: right; }
        .document-info h2 { margin: 0; font-size: 20px; font-weight: bold; color: #059669; }
        .document-info p { margin: 0; font-size: 14px; color: #6b7280; }
        
        .customer-info { margin-bottom: 24px; background: #f9fafb; padding: 16px; border-radius: 8px; }
        .customer-info h3 { margin: 0 0 8px 0; font-weight: bold; color: #1f2937; }
        .customer-info p { margin: 0; font-size: 14px; }
        
        .services-section { margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .services-section h3 { margin: 0 0 16px 0; font-weight: bold; color: #1f2937; display: flex; align-items: center; }
        .services-section .icon { color: #059669; margin-right: 8px; }
        .services-table { background: white; border-radius: 6px; overflow: hidden; border: 1px solid #e5e7eb; width: 100%; }
        .services-header { background: #f9fafb; padding: 12px; border-bottom: 1px solid #e5e7eb; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px; font-size: 14px; font-weight: 600; color: #374151; }
        .services-row { padding: 12px; border-bottom: 1px solid #f3f4f6; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px; align-items: center; }
        .services-total { padding: 12px; background: #f9fafb; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px; align-items: center; font-weight: bold; }
        .service-name { font-weight: 500; color: #1f2937; margin-bottom: 2px; }
        .service-description { font-size: 12px; color: #6b7280; }
        .service-duration { text-align: center; font-size: 14px; color: #374151; }
        .service-quantity { text-align: center; font-size: 14px; color: #374151; }
        .service-price { text-align: right; font-weight: 500; color: #1f2937; }
        .total-label { color: #1f2937; }
        .total-amount { text-align: right; color: #059669; font-size: 16px; }
        
        .payment-details { background: linear-gradient(to right, #ecfdf5, #f0fdf4); border: 2px solid #bbf7d0; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
        .payment-header { display: flex; align-items: center; margin-bottom: 16px; }
        .payment-header img { height: 32px; width: 32px; margin-right: 12px; }
        .payment-header h3 { margin: 0; font-size: 20px; font-weight: bold; color: #166534; }
        
        .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px; }
        .payment-item { background: white; padding: 16px; border-radius: 8px; border: 1px solid #bbf7d0; }
        .payment-item.blue { border-color: #bfdbfe; }
        .payment-item.orange { border-color: #fed7aa; }
        .payment-item.gray { border-color: #e5e7eb; grid-column: 1 / -1; }
        
        .payment-label { margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #059669; }
        .payment-value { margin: 0; font-size: 32px; font-family: monospace; font-weight: bold; color: #166534; }
        .payment-value.medium { font-size: 24px; }
        .payment-value.small { font-size: 18px; }
        .payment-value.blue { color: #1e40af; }
        .payment-value.orange { color: #9a3412; }
        .payment-value.gray { color: #1f2937; font-family: Arial, sans-serif; font-size: 16px; }
        
        .blue .payment-label { color: #2563eb; }
        .orange .payment-label { color: #ea580c; }
        .gray .payment-label { color: #6b7280; }
        
        .channels { margin-bottom: 24px; }
        .channels h4 { margin: 0 0 12px 0; font-size: 18px; font-weight: bold; color: #1f2937; }
        .channels-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .channel-item { display: flex; align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; }
        .channel-check { color: #2563eb; margin-right: 8px; }
        .channel-name { font-weight: 500; color: #1e40af; }
        
        .instructions { margin-bottom: 24px; }
        .instructions h4 { margin: 0 0 12px 0; font-size: 18px; font-weight: bold; color: #1f2937; }
        .instructions-content { background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .instructions ol { margin: 0; padding-left: 20px; }
        .instructions li { margin: 8px 0; font-size: 14px; color: #374151; line-height: 1.5; }
        .instructions-note { margin-top: 16px; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 8px; }
        .instructions-note p { margin: 0; font-size: 14px; }
        .instructions-note .note-title { font-weight: 500; color: #1e40af; margin-bottom: 4px; }
        .instructions-note .note-text { color: #1d4ed8; }
        
        .footer { border-top: 2px solid #d1d5db; padding-top: 16px; text-align: center; }
        .footer-info { margin-bottom: 12px; }
        .footer-info p { margin: 0; font-size: 14px; }
        .footer-company { font-weight: bold; color: #1f2937; }
        .footer-details { color: #6b7280; }
        .footer-timestamp { font-size: 12px; color: #9ca3af; }
        
        @media print {
          body { margin: 0; padding: 10mm; }
          @page { size: A4; margin: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <img src="/ANGOHOST-01.png" alt="AngoHost Logo" class="logo"/>
            <div class="company-info">
              <div style="margin-top: 8px; font-size: 12px; color: #6b7280; line-height: 1.4;">
                <div><strong>NIF:</strong> 5000088927</div>
                <div><strong>Endereço:</strong> Sequele, Rua 2, Bloco 11, Prédio Nº 3, 7º Andar, Aptº701</div>
                <div><strong>Cidade:</strong> Luanda, Angola</div>
                <div><strong>Tel:</strong> +244 942 090108 | <strong>Email:</strong> support@angohost.ao</div>
              </div>
            </div>
          </div>
          <div class="document-info" style="display: flex; flex-direction: column; align-items: center;">
            <h2 style="color: #059669; font-size: 22px;">PROFORMA</h2>
            <p style="margin: 2px 0; color: #6b7280;">Referência de Pagamento</p>
            <p style="margin: 0; color: #6b7280;">Gerado em: ${new Date().toLocaleString('pt-PT')}</p>
            
            <!-- Carimbo Oficial da Empresa -->
            <div style="margin-top: 16px; background: white; padding: 8px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <img src="/lovable-uploads/ba004896-0785-41b5-9735-628e5e3ed660.png" alt="Carimbo AngoHost" style="height: 90px; width: auto; display: block;"/>
            </div>
          </div>
        </div>

        <!-- Customer Info -->
        ${(customerName || customerEmail) ? `
        <div class="customer-info">
          <h3>Dados do Cliente</h3>
          ${customerName ? `<p>Nome: ${customerName}</p>` : ''}
          ${customerEmail ? `<p>Email: ${customerEmail}</p>` : ''}
          <p>Pedido: #${paymentReference.order_id.substring(0, 8)}</p>
        </div>
        ` : ''}

        <!-- Services/Products Details -->
        ${orderData?.order_items?.length ? `
        <div class="services-section">
          <h3><span class="icon">📦</span>Serviços Solicitados</h3>
          <div class="services-table">
            <div class="services-header">
              <span>Serviço</span>
              <span style="text-align: center;">Duração</span>
              <span style="text-align: center;">Quantidade</span>
              <span style="text-align: right;">Valor</span>
            </div>
            ${orderData.order_items.map((item: any) => `
              <div class="services-row">
                <div>
                  <div class="service-name">${item.name || 'Serviço'}</div>
                  ${item.description ? `<div class="service-description">${item.description}</div>` : ''}
                </div>
                <div class="service-duration">
                  ${item.duration ? `${item.duration} ${item.duration_unit === 'month' ? 'mês(es)' : item.duration_unit || 'período'}` : '-'}
                </div>
                <div class="service-quantity">${item.quantity || 1}</div>
                <div class="service-price">${formatCurrency(item.unit_price || 0)}</div>
              </div>
            `).join('')}
            <div class="services-total">
              <span class="total-label">Total</span>
              <span></span>
              <span></span>
              <span class="total-amount">${formatCurrency(orderData.total_amount || paymentReference.amount)}</span>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Payment Reference Details -->
        <div class="payment-details">
          <div class="payment-header">
            <img src="/lovable-uploads/f8d6177e-8235-4942-af13-8da5c89452a9.png" alt="Multicaixa"/>
            <h3>Dados para Pagamento Multicaixa</h3>
          </div>

          <div class="payment-grid">
            <!-- Entidade -->
            <div class="payment-item">
              <p class="payment-label">Entidade</p>
              <p class="payment-value">${paymentReference.entity}</p>
            </div>

            <!-- Referência -->
            <div class="payment-item blue">
              <p class="payment-label">Referência</p>
              <p class="payment-value blue">${paymentReference.reference}</p>
            </div>

            <!-- Valor -->
            <div class="payment-item">
              <p class="payment-label">Valor</p>
              <p class="payment-value medium">${formatCurrency(paymentReference.amount)}</p>
            </div>

            <!-- Validade -->
            <div class="payment-item orange">
              <p class="payment-label">Válida até</p>
              <p class="payment-value small orange">${formatDate(paymentReference.validity_date)}</p>
              <p style="margin: 0; font-size: 14px; color: #ea580c;">(${paymentReference.validity_days} dias)</p>
            </div>

          </div>
        </div>

        <!-- Payment Channels -->
        <div class="channels">
          <h4>📱 Onde Pagar</h4>
          <div class="channels-grid">
            ${paymentReference.payment_channels.map(channel => `
              <div class="channel-item">
                <span class="channel-check">✓</span>
                <span class="channel-name">${channel}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions">
          <h4>📋 ${paymentReference.instructions.pt.title}</h4>
          <div class="instructions-content">
            <ol>
              ${paymentReference.instructions.pt.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
            
            <div class="instructions-note">
              <p class="note-title">⚠️ Importante</p>
              <p class="note-text">${paymentReference.instructions.pt.note}</p>
            </div>
          </div>
        </div>

        <!-- Final Invoice Note -->
        <div style="margin-bottom: 24px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #92400e; display: flex; align-items: center;">
            📄 Fatura Final
          </h4>
          <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
            Após o pagamento, a fatura final certificada pela AGT chegará automaticamente ao seu email após o seu pagamento.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-info">
            <p class="footer-company">AngoHost, Lda</p>
            <p class="footer-details">Luanda, Angola | NIF: 5000088927</p>
            <p class="footer-details">Email: support@angohost.ao | Tel: +244 942 090108</p>
          </div>
          <p class="footer-timestamp">
            Este documento foi gerado eletronicamente - ${new Date().toLocaleString('pt-PT')}
          </p>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
};
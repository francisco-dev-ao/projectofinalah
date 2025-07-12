import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface InvoiceData {
  id: string;
  invoice_number: string;
  amount: number;
  created_at: string;
  status: string;
  orders?: {
    order_items?: Array<{
      name: string;
      description?: string;
      unit_price: number;
      quantity: number;
      duration?: number;
      duration_unit?: string;
    }>;
  };
}

export interface CustomerData {
  name: string;
  email: string;
  phone?: string;
}

export const generateInvoicePDF = async (
  invoice: InvoiceData,
  customer: CustomerData
): Promise<Blob> => {
  const content = generateInvoiceHTML(invoice, customer);
  
  // Create a temporary div to render the content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm';
  tempDiv.style.minHeight = '297mm';
  document.body.appendChild(tempDiv);

  try {
    // Generate canvas from the HTML content
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      width: 794, // A4 width in pixels at 96dpi
      height: 1123, // A4 height in pixels at 96dpi
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    
    return pdf.output('blob');
  } finally {
    document.body.removeChild(tempDiv);
  }
};

export const printInvoice = (invoice: InvoiceData, customer: CustomerData) => {
  const content = generateInvoiceHTML(invoice, customer);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  printWindow.document.write(content);
  printWindow.document.close();
  
  // Wait for images to load before printing
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
};

const generateInvoiceHTML = (invoice: InvoiceData, customer: CustomerData): string => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Fatura ${invoice.invoice_number} - AngoHost</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 20mm;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.4;
          color: #1f2937;
          background: white;
        }
        
        .invoice-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          min-height: 297mm;
          padding: 20mm;
        }
        
        .header {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .logo-section {
          display: flex;
          align-items: flex-start;
          gap: 20px;
        }
        
        .logo {
          height: 60px;
          width: auto;
        }
        
        .company-info h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .company-info p {
          margin: 2px 0;
          font-size: 16px;
          color: #059669;
          font-weight: 500;
        }
        
        .header-right {
          flex: 1;
          text-align: right;
        }
        
        .invoice-title {
          font-size: 36px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .invoice-number {
          font-size: 18px;
          color: #6b7280;
          margin-bottom: 16px;
        }
        
        .stamp-container {
          margin-top: 16px;
          background: white;
          padding: 8px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stamp-container img {
          height: 90px;
          width: auto;
          display: block;
        }
        
        .billing-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          gap: 40px;
        }
        
        .billing-info {
          flex: 1;
        }
        
        .billing-info h3 {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .billing-info p {
          margin: 4px 0;
          color: #6b7280;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        .items-table th,
        .items-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        
        .items-table .amount {
          text-align: right;
          font-weight: 600;
        }
        
        .total-section {
          margin-left: auto;
          width: 300px;
          margin-bottom: 30px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .total-row.final {
          border-bottom: 2px solid #1f2937;
          font-weight: bold;
          font-size: 18px;
          color: #1f2937;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-paid {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .status-unpaid {
          background-color: #fee2e2;
          color: #991b1b;
        }
        
        .status-draft {
          background-color: #f3f4f6;
          color: #374151;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        
        @media print {
          .invoice-container {
            padding: 0;
            margin: 0;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <img src="/ANGOHOST-01.png" alt="AngoHost Logo" class="logo"/>
            <div class="company-info">
              <div style="margin-top: 8px; font-size: 12px; color: #6b7280; line-height: 1.4;">
                <div><strong>NIF:</strong> 5000088927</div>
                <div><strong>Endereço:</strong> Sequele, Rua 2, Bloco 11, Prédio Nº 3, 7º Andar, Aptº701</div>
                <div><strong>Telefone:</strong> +244 947 666 629</div>
                <div><strong>Email:</strong> geral@angohost.ao</div>
              </div>
            </div>
            
            <div class="header-right">
              <div class="invoice-title">FATURA</div>
              <div class="invoice-number">#${invoice.invoice_number}</div>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Emitida em: ${formatDate(invoice.created_at)}</p>
              
              <!-- Carimbo Oficial da Empresa -->
              <div class="stamp-container">
                <img src="/lovable-uploads/ba004896-0785-41b5-9735-628e5e3ed660.png" alt="Carimbo AngoHost"/>
              </div>
            </div>
          </div>
        </div>

        <!-- Billing Information -->
        <div class="billing-section">
          <div class="billing-info">
            <h3>Faturar Para:</h3>
            <p><strong>${customer.name}</strong></p>
            <p>${customer.email}</p>
            ${customer.phone ? `<p>${customer.phone}</p>` : ''}
          </div>
          
          <div class="billing-info">
            <h3>Detalhes da Fatura:</h3>
            <p><strong>Número:</strong> ${invoice.invoice_number}</p>
            <p><strong>Data:</strong> ${formatDate(invoice.created_at)}</p>
            <p><strong>Status:</strong> 
              <span class="status-badge ${invoice.status === 'paid' ? 'status-paid' : 
                                       invoice.status === 'unpaid' ? 'status-unpaid' : 'status-draft'}">
                ${invoice.status === 'paid' ? 'Pago' : 
                  invoice.status === 'unpaid' ? 'Não Pago' : 'Pendente'}
              </span>
            </p>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Duração</th>
              <th>Qtd</th>
              <th>Preço Unitário</th>
              <th class="amount">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.orders?.order_items?.map(item => `
              <tr>
                <td>
                  <strong>${item.name}</strong>
                  ${item.description ? `<br><small style="color: #6b7280;">${item.description}</small>` : ''}
                </td>
                <td>
                  ${item.duration && item.duration_unit ? 
                    `${item.duration} ${item.duration_unit === 'month' ? 'mês(es)' : 
                                      item.duration_unit === 'year' ? 'ano(s)' : 
                                      item.duration_unit}` : '--'}
                </td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.unit_price)}</td>
                <td class="amount">${formatPrice(item.unit_price * item.quantity)}</td>
              </tr>
            `).join('') || `
              <tr>
                <td colspan="5" style="text-align: center; color: #6b7280;">Nenhum item encontrado</td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- Total Section -->
        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatPrice(invoice.amount)}</span>
          </div>
          <div class="total-row">
            <span>IVA (0%):</span>
            <span>${formatPrice(0)}</span>
          </div>
          <div class="total-row final">
            <span>Total:</span>
            <span>${formatPrice(invoice.amount)}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Obrigado pelo seu negócio!</p>
          <p>Esta é uma fatura gerada eletronicamente e é válida sem assinatura física.</p>
          <p>Para questões sobre esta fatura, entre em contato conosco através do email: geral@angohost.ao</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
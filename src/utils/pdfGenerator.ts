import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { extractServiceDescription } from '@/utils/invoice/serviceDescriptionExtractor';

export class PDFGenerator {
  private static COLORS = {
    primary: [41, 128, 185] as [number, number, number],
    secondary: [52, 73, 94] as [number, number, number],
    success: [39, 174, 96] as [number, number, number],
    warning: [211, 84, 0] as [number, number, number],
    danger: [192, 57, 43] as [number, number, number]
  };

  public static async generateInvoicePDF(invoice: any): Promise<Uint8Array> {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.width;
    const margin = pageWidth > 200 ? 15 : 10;
    
    this.addLogo(doc);
    this.addResponsiveHeader(doc, '', invoice.invoice_number || '', pageWidth);
    this.addResponsiveCompanyInfo(doc);
    
    const customer = invoice.orders?.profiles || {};
    let currentY = this.addResponsiveCustomerInfo(doc, customer);
    
    currentY = this.addResponsiveInvoiceDetails(doc, invoice, currentY);
    
    const items = this.prepareInvoiceItems(invoice);
    currentY = this.addImprovedItemsTable(doc, items, currentY, pageWidth);
    
    this.addResponsiveTotals(doc, items, invoice, currentY, pageWidth);
    
    // Buscar a referência mais recente antes de adicionar os detalhes de pagamento
    if (invoice.orders?.payment_references && invoice.orders.payment_references.length > 0) {
      const latestRef = invoice.orders.payment_references
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      invoice.payment_reference = latestRef.reference;
    }
    
    this.addPaymentDetails(doc, invoice, currentY + 40);
    this.addStampAndSignature(doc);
    this.addResponsiveFooter(doc);
    
    // Salvar PDF com a referência atualizada
    if (invoice.payment_reference) {
      try {
        await supabase
          .from('invoices')
          .update({ 
            payment_reference: invoice.payment_reference,
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice.id);
      } catch (error) {
        console.error('Erro ao salvar referência na fatura:', error);
      }
    }
    
    return new Uint8Array(doc.output('arraybuffer'));
  }

  private static addLogo(doc: jsPDF): void {
    try {
      // Logo da empresa no topo esquerdo
      const logoPath = '/ANGOHOST-01.png';
      doc.addImage(logoPath, 'PNG', 15, 10, 40, 20);
    } catch (error) {
      console.log('Logo não encontrada, continuando sem logo');
    }
  }

  public static generateOrderPDF(order: any): Uint8Array {
    const doc = new jsPDF();
    
    this.addResponsiveHeader(doc, 'PEDIDO', order.order_number || order.id, doc.internal.pageSize.width);
    this.addResponsiveCompanyInfo(doc);
    
    const customer = order.profiles || {};
    let currentY = this.addResponsiveCustomerInfo(doc, customer);
    
    currentY = this.addOrderDetails(doc, order, currentY);
    
    const items = order.order_items || [];
    this.addOrderItemsTable(doc, items, currentY);
    
    this.addStampAndSignature(doc);
    this.addResponsiveFooter(doc);
    
    return new Uint8Array(doc.output('arraybuffer'));
  }

  public static generateServicePDF(service: any): Uint8Array {
    const doc = new jsPDF();
    
    this.addResponsiveHeader(doc, 'SERVIÇO', service.service_name || service.id, doc.internal.pageSize.width);
    this.addResponsiveCompanyInfo(doc);
    this.addServiceDetails(doc, service);
    this.addStampAndSignature(doc);
    this.addResponsiveFooter(doc);
    
    return new Uint8Array(doc.output('arraybuffer'));
  }

  private static addResponsiveHeader(doc: jsPDF, title: string, invoiceNumber: string, pageWidth: number): void {
    const margin = 15;
    
    // Remove a palavra FATURA para PDFs de faturas, mas mantém para outros tipos
    if (title && title !== '') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(pageWidth > 200 ? 26 : 22);
      doc.text(title, pageWidth - margin, 25, { align: 'right' });
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(pageWidth > 200 ? 12 : 10);
    if (invoiceNumber) {
      doc.text(`Nº: ${invoiceNumber}`, margin, 52);
    }
    
    doc.text(`Emitido: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, margin, 58);
    
    doc.setDrawColor(...this.COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, 65, pageWidth - margin, 65);
  }

  private static addResponsiveCompanyInfo(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(pageWidth > 200 ? 14 : 12);
    doc.text('AngoHost', margin, 75);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(pageWidth > 200 ? 10 : 9);
    doc.text('Luanda, Angola', margin, 82);
    doc.text('NIF: 5000088927', margin, 87);
    doc.text('support@angohost.ao', margin, 92);
    doc.text('+244 942 090108', margin, 97);
  }

  private static addResponsiveCustomerInfo(doc: jsPDF, customer: any): number {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const startY = 105;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(pageWidth > 200 ? 12 : 10);
    doc.text('Cliente:', margin, startY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(pageWidth > 200 ? 10 : 9);
    
    let currentY = startY + 7;
    // Nome ou Empresa
    if (customer?.name || customer?.company_name) {
      doc.text(customer.name || customer.company_name, margin, currentY);
      currentY += 5;
    }
    // Email (sempre mostrar se existir)
    if (customer?.email) {
      doc.text(`Email: ${customer.email}`, margin, currentY);
      currentY += 5;
    }
    if (customer?.phone) {
      doc.text(`Tel: ${customer.phone}`, margin, currentY);
      currentY += 5;
    }
    if (customer?.nif) {
      doc.text(`NIF: ${customer.nif}`, margin, currentY);
      currentY += 5;
    }
    return currentY + 10;
  }

  private static addResponsiveInvoiceDetails(doc: jsPDF, invoice: any, startY: number): number {
    const pageWidth = doc.internal.pageSize.width;
    const rightColumnX = pageWidth > 200 ? pageWidth - 80 : pageWidth - 60;
    
    doc.setFontSize(pageWidth > 200 ? 10 : 9);
    
    doc.text(`Data: ${format(new Date(invoice.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, rightColumnX, startY);
    doc.text(`Vencimento: ${format(new Date(invoice.due_date || new Date()), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, rightColumnX, startY + 5);
    doc.text(`Status: ${this.formatStatus(invoice.status)}`, rightColumnX, startY + 10);
    
    return startY + 20;
  }

  private static addOrderDetails(doc: jsPDF, order: any, startY: number): number {
    const pageWidth = doc.internal.pageSize.width;
    const rightColumnX = pageWidth > 200 ? pageWidth - 80 : pageWidth - 60;
    
    doc.setFontSize(pageWidth > 200 ? 10 : 9);
    
    doc.text(`Data: ${format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, rightColumnX, startY);
    doc.text(`Status: ${this.formatStatus(order.status)}`, rightColumnX, startY + 5);
    
    return startY + 20;
  }

  private static addServiceDetails(doc: jsPDF, service: any): void {
    const margin = 15;
    let currentY = 105;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Detalhes do Serviço:', margin, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    currentY += 10;
    
    doc.text(`Nome: ${service.service_name || 'N/A'}`, margin, currentY);
    currentY += 7;
    doc.text(`Status: ${this.formatStatus(service.status)}`, margin, currentY);
    currentY += 7;
    doc.text(`Data de Criação: ${format(new Date(service.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, margin, currentY);
    
    if (service.activation_date) {
      currentY += 7;
      doc.text(`Data de Ativação: ${format(new Date(service.activation_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, margin, currentY);
    }
  }

  private static addOrderItemsTable(doc: jsPDF, items: any[], startY: number): number {
    const margin = 15;
    
    const tableData = items.map((item: any) => [
      this.truncateText(item.product_name || 'Produto', 30),
      String(item.quantity || 1),
      this.formatCurrency(item.price || 0),
      this.formatCurrency((item.quantity || 1) * (item.price || 0))
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['Produto', 'Qtd', 'Preço Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.COLORS.primary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  private static addImprovedItemsTable(doc: jsPDF, items: any[], startY: number, pageWidth: number): number {
    const margin = 15;
    const columnWidths = {
      description: 105,
      quantity: 18,
      unitPrice: 28,
      total: 28
    };

    const tableData = items.map((item: any) => [
      this.truncateText(this.getServiceDescription(item), 70),
      String(item.quantity || 1),
      this.formatCurrency(item.unit_price || item.price || 0),
      this.formatCurrency((item.quantity || 1) * (item.unit_price || item.price || 0))
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['Serviço/Produto', 'Qtd', 'Preço Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.COLORS.primary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        halign: 'left',
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { 
          cellWidth: columnWidths.description, 
          halign: 'left' 
        },
        1: { 
          cellWidth: columnWidths.quantity, 
          halign: 'center',
          fontStyle: 'bold'
        },
        2: { 
          cellWidth: columnWidths.unitPrice, 
          halign: 'right' 
        },
        3: { 
          cellWidth: columnWidths.total, 
          halign: 'right',
          fontStyle: 'bold'
        }
      },
      margin: { left: margin, right: margin },
      tableWidth: 'wrap'
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  private static getServiceDescription(item: any): string {
    return extractServiceDescription(item);
  }

  private static addResponsiveTotals(doc: jsPDF, items: any[], invoice: any, startY: number, pageWidth: number): void {
    const margin = 15;
    const rightAlign = pageWidth - 20;
    const labelX = pageWidth - 70;
    
    const subtotal = items.reduce((acc: number, item: any) => 
      acc + ((item.quantity || 1) * (item.unit_price || 0)), 0);
    const total = invoice.amount || subtotal; // total agora é só o valor da soma

    doc.setFontSize(10);
    
    doc.text('Subtotal:', labelX, startY);
    doc.text(this.formatCurrency(subtotal), rightAlign, startY, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text('Total:', labelX, startY + 7);
    doc.text(this.formatCurrency(total), rightAlign, startY + 7, { align: 'right' });
  }

  private static addPaymentDetails(doc: jsPDF, invoice: any, startY: number): void {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Pagamento por Referência Multicaixa', 15, startY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Buscar referência de pagamento associada ao pedido
    doc.text('Entidade: 11333', 15, startY + 7);
    
    // Usar referência de pagamento ou placeholder se não existir
    const paymentReference = invoice.payment_reference || 'Pendente';
    
    if (paymentReference === 'Pendente') {
      console.warn('No payment reference found, using placeholder');
    }
    doc.text(`Referência: ${paymentReference}`, 15, startY + 14);
    
    // Mostrar valor total da fatura
    const totalAmount = invoice.orders?.total_amount || invoice.amount || 0;
    doc.text(`Valor: ${this.formatCurrency(totalAmount)}`, 15, startY + 21);
    
    // Mostrar validade (2 dias após criação)
    const validityDate = new Date(invoice.created_at);
    validityDate.setDate(validityDate.getDate() + 2);
    doc.text(`Validade: ${validityDate.toLocaleDateString('pt-PT')}`, 15, startY + 28);
    
    doc.setFontSize(8);
    doc.text('Pagamento via ATM, Internet Banking, Multicaixa Express ou Balcão Bancário', 15, startY + 38);
    doc.text('Para dúvidas, contacte o nosso suporte: support@angohost.ao', 15, startY + 45);
  }

  private static addStampAndSignature(doc: jsPDF): void {
    try {
      const pageHeight = doc.internal.pageSize.height;
      const stampY = pageHeight - 40;
      
      // Usar a nova imagem do carimbo
      const stampPath = '/lovable-uploads/e588f3a2-9ad0-463d-8c9f-2d2eebebc765.png';
      doc.addImage(stampPath, 'PNG', 120, stampY - 5, 50, 20);
    } catch (error) {
      console.log('Erro ao adicionar carimbo:', error);
    }
  }

  private static addResponsiveFooter(doc: jsPDF): void {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    
    doc.setDrawColor(...this.COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    doc.text(
      'AngoHost - ' + new Date().getFullYear(),
      pageWidth / 2,
      pageHeight - 18,
      { align: 'center' }
    );
    
    doc.text(
      'Este documento foi gerado eletronicamente e é válido sem assinatura.',
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
  }

  private static prepareInvoiceItems(invoice: any): any[] {
    let items = [];
    
    if (invoice.orders?.order_items && invoice.orders.order_items.length > 0) {
      items = invoice.orders.order_items;
    } else {
      items = [{
        name: 'Serviço',
        description: invoice.description || 'Serviço de hospedagem',
        quantity: 1,
        unit_price: invoice.amount || 0
      }];
    }
    
    return items;
  }

  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private static formatCurrency(value: number): string {
    // Formato correto: KZ 35.000,00 (ponto para milhares, vírgula para decimais)
    return `KZ ${new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(value)}`;
  }

  private static formatStatus(status: string): string {
    if (!status) return '';
    
    const statusMap: Record<string, string> = {
      'draft': 'Rascunho',
      'issued': 'Emitida',
      'paid': 'Paga',
      'canceled': 'Cancelada'
    };
    
    return statusMap[status.toLowerCase()] || status;
  }
}

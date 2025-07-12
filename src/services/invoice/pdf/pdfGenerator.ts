import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { extractServiceDescription } from '@/utils/invoice/serviceDescriptionExtractor';

export class InvoicePDFGenerator {
  private doc: jsPDF;
  
  constructor() {
    this.doc = new jsPDF();
  }

  public generatePDF(invoice: any, invoiceItems: any[], companySettings: any): Uint8Array {
    this.addLogo();
    this.addHeader(invoice);
    this.addCompanyInfo(companySettings);
    this.addCustomerInfo(invoice);
    this.addInvoiceDetails(invoice);
    this.addItemsTable(invoiceItems);
    this.addTotals(invoice, invoiceItems);
    this.addPaymentDetails(invoice);
    this.addStampAndSignature();
    this.addFooter();
    
    return new Uint8Array(this.doc.output('arraybuffer'));
  }

  private addLogo(): void {
    try {
      // Logo da empresa no topo esquerdo
      const logoPath = '/ANGOHOST-01.png';
      this.doc.addImage(logoPath, 'PNG', 15, 10, 40, 20);
    } catch (error) {
      console.log('Logo não encontrada, continuando sem logo');
    }
  }

  private addHeader(invoice: any): void {
    // Remove a palavra "FATURA" do cabeçalho
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text(`Nº: ${invoice.invoice_number}`, 15, 50);
    this.doc.text(`Data: ${format(new Date(invoice.created_at), 'dd/MM/yyyy HH:mm')}`, 15, 55);
    this.doc.text(`Vencimento: ${format(new Date(invoice.due_date), 'dd/MM/yyyy HH:mm')}`, 15, 60);
    this.doc.text(`Status: ${invoice.status?.toUpperCase() || 'EMITIDA'}`, 15, 65);
  }

  private addCompanyInfo(companySettings: any): void {
    this.doc.setFontSize(12);
    this.doc.text(companySettings?.company_name || 'AngoHost', 15, 80);
    this.doc.setFontSize(10);
    this.doc.text(companySettings?.company_address || 'Luanda, Angola', 15, 85);
    // Usar NIF real do sistema
    this.doc.text(`NIF: ${companySettings?.company_nif || '5417377487'}`, 15, 90);
    this.doc.text(companySettings?.company_email || 'support@angohost.ao', 15, 95);
    this.doc.text(companySettings?.company_phone || '+244 942 090108', 15, 100);
  }

  private addCustomerInfo(invoice: any): void {
    this.doc.setFontSize(12);
    this.doc.text('Faturar para:', 15, 115);
    this.doc.setFontSize(10);
    const customer = invoice.orders?.profiles;
    if (customer) {
      this.doc.text(customer.name || customer.company_name || 'Cliente', 15, 120);
      if (customer.address) this.doc.text(customer.address, 15, 125);
      this.doc.text(customer.email || '', 15, 130);
      if (customer.phone) this.doc.text(`Tel: ${customer.phone}`, 15, 135);
      if (customer.nif) this.doc.text(`NIF: ${customer.nif}`, 15, 140);
    }
  }

  private addInvoiceDetails(invoice: any): void {
    // Invoice details are already added in addHeader
  }

  private addItemsTable(invoiceItems: any[]): void {
    const tableY = 150;
    
    if (invoiceItems && invoiceItems.length > 0) {
      // Colunas: Descrição, Quantidade, Preço Unitário, Total
      const columnWidths = {
        description: 100,  // Espaço para descrição
        quantity: 25,
        unitPrice: 35,
        total: 35
      };

      const tableData = invoiceItems.map((item: any) => {
        const description = this.getServiceDescription(item);
        const quantity = item.quantity || 1;
        const unitPrice = item.unit_price || 0;
        const total = quantity * unitPrice;
        
        return [
          this.truncateText(description, 70),
          String(quantity),
          this.formatCurrency(unitPrice),
          this.formatCurrency(total)
        ];
      });
      
      autoTable(this.doc, {
        head: [['Serviço/Produto', 'Quantidade', 'Preço Unitário', 'Total']],
        body: tableData,
        startY: tableY,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
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
        margin: { left: 15, right: 15 },
        tableWidth: 'wrap'
      });
    } else {
      this.doc.text('Nenhum item encontrado para esta fatura', 15, tableY + 10);
    }
  }

  private getServiceDescription(item: any): string {
    return extractServiceDescription(item);
  }

  private addTotals(invoice: any, invoiceItems: any[]): void {
    const finalY = (this.doc as any).lastAutoTable?.finalY || 195;
    
    if (invoiceItems && invoiceItems.length > 0) {
      const totalAmount = invoiceItems.reduce((acc: number, item: any) => {
        return acc + (item.subtotal || (item.quantity * item.unit_price) || 0);
      }, 0);
      
      // Usar apenas o total sem RF
      const finalTotal = invoice.orders?.total_amount || totalAmount;
      
      this.doc.text('Total Geral:', 140, finalY + 17);
      this.doc.text(this.formatCurrency(finalTotal), 170, finalY + 17, { align: 'right' });
    }
  }

  private addPaymentDetails(invoice: any): void {
    const finalY = (this.doc as any).lastAutoTable?.finalY || 195;
    const startY = finalY + 40;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Pagamento por Referência Multicaixa', 15, startY);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    
    // Entidade fixa
    this.doc.text('Entidade: 11333', 15, startY + 7);

    // Verifica se há referências válidas - permitir PDF mesmo sem referência para debugging
    if (!invoice.orders?.payment_references || invoice.orders.payment_references.length === 0) {
        console.warn('No payment references found for invoice - will show placeholder data');
    }

    // Pega a referência mais recente ou dados da fatura
    let refValue = '---';
    if (invoice.orders?.payment_references && invoice.orders.payment_references.length > 0) {
        const latestRef = invoice.orders.payment_references
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        refValue = latestRef.reference && latestRef.reference !== 'Pendente' ? latestRef.reference : '---';
    } else if (invoice.payment_reference) {
        // Fallback para payment_reference direto na invoice
        refValue = invoice.payment_reference;
    }

    this.doc.text(`Referência: ${refValue}`, 15, startY + 14);

    // Valor total da fatura
    const totalAmount = invoice.orders?.total_amount || invoice.amount || 0;
    this.doc.text(`Valor: ${this.formatCurrency(totalAmount)}`, 15, startY + 21);

    // Validade (2 dias após criação)
    const validityDate = new Date(invoice.created_at);
    validityDate.setDate(validityDate.getDate() + 2);
    this.doc.text(`Validade: ${validityDate.toLocaleDateString('pt-PT')}`, 15, startY + 28);

    this.doc.setFontSize(8);
    this.doc.text('Pagamento via ATM, Internet Banking, Multicaixa Express ou Balcão Bancário', 15, startY + 38);
    this.doc.text('Para dúvidas, contacte o nosso suporte: support@angohost.ao', 15, startY + 45);
  }

  private addStampAndSignature(): void {
    try {
      const pageHeight = this.doc.internal.pageSize.height;
      const stampY = pageHeight - 40;
      
      // Usar a nova imagem do carimbo
      const stampPath = '/lovable-uploads/e588f3a2-9ad0-463d-8c9f-2d2eebebc765.png';
      this.doc.addImage(stampPath, 'PNG', 120, stampY - 5, 50, 20);
    } catch (error) {
      console.log('Erro ao adicionar carimbo:', error);
    }
  }

  private addFooter(): void {
    const pageCount = this.doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.text('Este documento foi gerado eletronicamente e é válido sem assinatura.', this.doc.internal.pageSize.width / 2, 280, { align: 'center' });
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private formatCurrency(value: number): string {
    // Formato correto: KZ 35.000,00
    return `KZ ${new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(value)}`;
  }
}

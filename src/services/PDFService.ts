
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Definir tipos para jsPDF com autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export class PDFService {
  private static COLORS = {
    primary: [41, 128, 185] as [number, number, number],
    secondary: [52, 73, 94] as [number, number, number],
    success: [39, 174, 96] as [number, number, number],
    warning: [211, 84, 0] as [number, number, number],
    danger: [192, 57, 43] as [number, number, number]
  };

  public static generatePDF(pedido: any): Uint8Array {
    const doc = new jsPDF();

    // Ensure autoTable is available
    if (typeof doc.autoTable !== 'function') {
      console.error('autoTable plugin not loaded properly');
      throw new Error('PDF generation plugin not available');
    }

    // Cabeçalho
    this.addHeader(doc, 'PEDIDO', pedido.order_number || pedido.id);
    
    // Informações do cliente
    const customer = pedido.profiles || {};
    doc.setFontSize(10);
    doc.text('Cliente:', 15, 60);
    doc.text(customer?.name || customer?.company_name || 'Cliente', 15, 65);
    doc.text(customer?.email || '', 15, 70);
    if (customer?.phone) {
      doc.text(`Telefone: ${customer.phone}`, 15, 75);
    }
    
    // Informações do pedido
    doc.text(`Data: ${format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR })}`, 130, 60);
    doc.text(`Status: ${this.formatStatus(pedido.status)}`, 130, 65);
    doc.text(`Método Pagamento: ${this.formatPaymentMethod(pedido.payment_method)}`, 130, 70);
    
    // Preparar dados da tabela
    const items = pedido.order_items || [];
    const tableData = items.map((item: any) => [
      item.product?.name || item.name || 'Produto',
      item.quantity || 1,
      this.formatCurrency(item.unit_price || 0),
      this.formatCurrency((item.quantity || 1) * (item.unit_price || 0))
    ]);

    // Tabela de itens
    doc.autoTable({
      startY: 85,
      head: [['Produto/Serviço', 'Qtd', 'Preço Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.COLORS.primary,
        textColor: 255,
        fontSize: 10
      },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      }
    });

    // Total do pedido
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 140, finalY);
    doc.text(this.formatCurrency(pedido.total_amount || 0), 170, finalY, { align: 'right' });
    
    this.addFooter(doc);
    
    return new Uint8Array(doc.output('arraybuffer'));
  }

  private static addHeader(doc: jsPDF, title: string, id: string): void {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(title, 15, 20);
    
    doc.setFontSize(10);
    if (id) {
      doc.text(`Nº: ${id}`, 15, 30);
    }
    
    doc.text(`Emitido: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, 15, 35);
    
    doc.setDrawColor(...this.COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(15, 45, 195, 45);
  }
  
  private static addFooter(doc: jsPDF): void {
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setDrawColor(...this.COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 20, 195, pageHeight - 20);
    
    doc.setFontSize(8);
    doc.text(
      'AngoHost - ' + new Date().getFullYear(),
      doc.internal.pageSize.width / 2,
      pageHeight - 15,
      { align: 'center' }
    );
    
    doc.text(
      'Este documento foi gerado eletronicamente e é válido sem assinatura.',
      doc.internal.pageSize.width / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  private static formatCurrency(value: number): string {
    return `KZ ${new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(value)}`;
  }
  
  private static formatStatus(status: string): string {
    if (!status) return '';
    
    const statusMap: Record<string, string> = {
      'active': 'Ativo',
      'pending': 'Pendente',
      'awaiting': 'Aguardando',
      'canceled': 'Cancelado',
      'cancelled': 'Cancelado',
      'expired': 'Expirado',
      'suspended': 'Suspenso',
      'paid': 'Pago',
      'unpaid': 'Não Pago',
      'draft': 'Rascunho',
      'approved': 'Aprovado'
    };
    
    return statusMap[status.toLowerCase()] || status;
  }
  
  private static formatPaymentMethod(method: string): string {
    if (!method) return '';
    
    const methodMap: Record<string, string> = {
      'multicaixa': 'Multicaixa',
      'bank_transfer': 'Transferência Bancária',
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito'
    };
    
    return methodMap[method.toLowerCase()] || method;
  }
}

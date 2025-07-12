
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, Share2, Loader2, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils';

interface InvoiceDetailsHeaderProps {
  invoice: any;
  isGeneratingPDF: boolean;
  isSharing: boolean;
  isPrinting?: boolean;
  onDownload: () => void;
  onPrint: () => void;
  onShare: () => void;
}

const InvoiceDetailsHeader: React.FC<InvoiceDetailsHeaderProps> = ({
  invoice,
  isGeneratingPDF,
  isSharing,
  isPrinting = false,
  onDownload,
  onPrint,
  onShare
}) => {
  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pending':
      case 'issued':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'cancelled':
      case 'canceled':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">Cancelado</Badge>;
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateString = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/customer/invoices" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para faturas
        </Link>
      </Button>
      
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Fatura #{invoice?.invoice_number}
            </h1>
            {getStatusBadge(invoice?.status)}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Emitida em:</span> {formatDateString(invoice?.created_at)}</p>
            {invoice?.due_date && (
              <p><span className="font-medium">Vencimento:</span> {formatDateString(invoice?.due_date)}</p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {onPrint && (
            <Button 
              onClick={onPrint}
              disabled={isPrinting || isGeneratingPDF}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {isPrinting ? 'Abrindo...' : 'Imprimir'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsHeader;

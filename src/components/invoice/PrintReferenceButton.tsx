import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PrintReferenceButtonProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function PrintReferenceButton({ invoiceId, invoiceNumber }: PrintReferenceButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      
      // Buscar dados da fatura
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            order_items (*)
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Erro ao buscar dados da fatura');
        return;
      }

      if (!invoice) {
        toast.error('Fatura não encontrada');
        return;
      }

      // Extrair referência de pagamento se existir
      const paymentReference = invoice.payment_reference;
      const amount = invoice.amount || invoice.orders?.total_amount || 0;

      // Criar janela de impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Não foi possível abrir a janela de impressão');
        return;
      }

      // HTML para impressão
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Referência de Pagamento - Fatura ${invoiceNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            .reference-box {
              border: 2px solid #007bff;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              background-color: #f8f9fa;
            }
            .reference-title {
              font-size: 18px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 15px;
            }
            .reference-item {
              margin: 10px 0;
              font-size: 16px;
            }
            .reference-item strong {
              color: #333;
            }
            .amount {
              font-size: 20px;
              font-weight: bold;
              color: #28a745;
            }
            .instructions {
              margin-top: 30px;
              padding: 20px;
              background-color: #e9ecef;
              border-radius: 8px;
            }
            .instructions h3 {
              color: #495057;
              margin-bottom: 15px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">AngoHost</div>
            <div>Referência de Pagamento</div>
          </div>

          <div class="reference-box">
            <div class="reference-title">Detalhes da Referência</div>
            <div class="reference-item">
              <strong>Fatura:</strong> #${invoiceNumber}
            </div>
            ${paymentReference ? `
              <div class="reference-item">
                <strong>Referência:</strong> ${paymentReference}
              </div>
            ` : ''}
            <div class="reference-item">
              <strong>Montante:</strong> <span class="amount">${amount.toLocaleString('pt-PT', { 
                style: 'currency', 
                currency: 'AOA' 
              })}</span>
            </div>
            <div class="reference-item">
              <strong>Data:</strong> ${new Date().toLocaleDateString('pt-PT')}
            </div>
          </div>

          <div class="instructions">
            <h3>Instruções de Pagamento:</h3>
            <p>1. Acesse seu aplicativo bancário ou terminal ATM</p>
            <p>2. Selecione a opção "Pagamento de Serviços" ou "Multicaixa"</p>
            ${paymentReference ? `<p>3. Digite a referência: <strong>${paymentReference}</strong></p>` : ''}
            <p>4. Confirme o valor: <strong>${amount.toLocaleString('pt-PT', { 
              style: 'currency', 
              currency: 'AOA' 
            })}</strong></p>
            <p>5. Complete o pagamento</p>
          </div>

          <div class="footer">
            <p>AngoHost - Soluções em Hospedagem e Domínios</p>
            <p>Email: support@angohost.ao | Tel: +244 942 090108</p>
            <p>Este documento foi gerado eletronicamente - ${new Date().toLocaleString('pt-PT')}</p>
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
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      toast.success('Documento de referência aberto para impressão!');
      
    } catch (error) {
      console.error('Error printing reference:', error);
      toast.error('Erro ao preparar impressão da referência');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      disabled={isPrinting}
      className="flex items-center gap-2"
    >
      {isPrinting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      Imprimir Referência
    </Button>
  );
}
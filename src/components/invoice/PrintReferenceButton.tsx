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

      // HTML para impressão profissional certificada AGT
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Referência de Pagamento - AngoHost</title>
          <meta charset="UTF-8">
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: white;
              color: #333;
              line-height: 1.4;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .document {
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              background: white;
              min-height: 100vh;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 30px;
              border-bottom: 3px solid #1e40af;
            }
            
            .logo {
              font-size: 32px;
              font-weight: 900;
              color: #1e40af;
              letter-spacing: -1px;
              margin-bottom: 8px;
            }
            
            .document-title {
              font-size: 18px;
              color: #64748b;
              font-weight: 500;
              margin-bottom: 20px;
            }
            
            .document-info {
              text-align: right;
              font-size: 12px;
              color: #64748b;
            }
            
            .data-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin: 40px 0;
            }
            
            .data-section {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 24px;
            }
            
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 20px;
              padding-bottom: 8px;
              border-bottom: 2px solid #dbeafe;
            }
            
            .data-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .data-row:last-child {
              border-bottom: none;
            }
            
            .data-label {
              font-weight: 600;
              color: #475569;
              font-size: 14px;
            }
            
            .data-value {
              color: #1e293b;
              font-weight: 500;
              text-align: right;
              font-size: 14px;
            }
            
            .reference-highlight {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 30px;
              border-radius: 16px;
              text-align: center;
              margin: 40px 0;
              box-shadow: 0 10px 25px rgba(30, 64, 175, 0.2);
            }
            
            .reference-title {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 20px;
              opacity: 0.9;
            }
            
            .reference-details {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-top: 20px;
            }
            
            .reference-item {
              background: rgba(255, 255, 255, 0.1);
              padding: 15px;
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            
            .reference-item-label {
              font-size: 12px;
              opacity: 0.8;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .reference-item-value {
              font-size: 16px;
              font-weight: 700;
            }
            
            .amount-value {
              font-size: 24px;
              font-weight: 900;
            }
            
            .instructions {
              background: #f0f9ff;
              border: 1px solid #bae6fd;
              border-radius: 12px;
              padding: 30px;
              margin: 40px 0;
            }
            
            .instructions-title {
              font-size: 18px;
              font-weight: 700;
              color: #0c4a6e;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .instruction-step {
              display: flex;
              align-items: flex-start;
              gap: 15px;
              margin: 15px 0;
              padding: 15px;
              background: white;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            
            .step-number {
              background: #3b82f6;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 700;
              flex-shrink: 0;
              margin-top: 2px;
            }
            
            .step-text {
              color: #1e293b;
              font-size: 14px;
              line-height: 1.5;
            }
            
            .security-note {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
              text-align: center;
            }
            
            .security-note-title {
              font-weight: 700;
              color: #92400e;
              margin-bottom: 8px;
            }
            
            .security-note-text {
              font-size: 13px;
              color: #a16207;
            }
            
            .footer {
              margin-top: 60px;
              padding-top: 30px;
              border-top: 2px solid #e2e8f0;
              text-align: center;
              color: #64748b;
            }
            
            .company-info {
              margin-bottom: 15px;
            }
            
            .company-name {
              font-weight: 700;
              color: #1e40af;
              font-size: 16px;
            }
            
            .company-details {
              font-size: 12px;
              line-height: 1.6;
              margin: 10px 0;
            }
            
            .certification {
              font-size: 11px;
              color: #64748b;
              font-style: italic;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
            }
            
            @media print {
              body { 
                margin: 0;
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .document { 
                margin: 0; 
                padding: 20px;
                min-height: auto;
              }
              .no-print { 
                display: none !important; 
              }
              .reference-highlight {
                box-shadow: none;
              }
            }
            
            @page {
              margin: 1cm;
              size: A4;
            }
          </style>
        </head>
        <body>
          <div class="document">
            <div class="header">
              <div class="logo">AngoHost</div>
              <div class="document-title">Referência de Pagamento Multicaixa</div>
              <div class="document-info">
                Documento: REF-${invoiceNumber} | ${new Date().toLocaleDateString('pt-PT', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} às ${new Date().toLocaleTimeString('pt-PT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>

            <div class="data-grid">
              <div class="data-section">
                <div class="section-title">Dados da Empresa</div>
                <div class="data-row">
                  <span class="data-label">RAZÃO SOCIAL</span>
                  <span class="data-value">AngoHost, Lda</span>
                </div>
                <div class="data-row">
                  <span class="data-label">NIF</span>
                  <span class="data-value">5000000000</span>
                </div>
                <div class="data-row">
                  <span class="data-label">ENDEREÇO</span>
                  <span class="data-value">Rua Principal, 123<br>Luanda, Angola</span>
                </div>
                <div class="data-row">
                  <span class="data-label">CONTACTOS</span>
                  <span class="data-value">support@angohost.ao<br>+244 942 090 108<br>www.angohost.ao</span>
                </div>
              </div>

              <div class="data-section">
                <div class="section-title">Dados do Cliente</div>
                <div class="data-row">
                  <span class="data-label">NOME</span>
                  <span class="data-value">${invoice.orders?.customer_name || 'Cliente'}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">EMAIL</span>
                  <span class="data-value">${invoice.orders?.customer_email || 'N/A'}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">TELEFONE</span>
                  <span class="data-value">${invoice.orders?.customer_phone || 'N/A'}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">DATA DO PEDIDO</span>
                  <span class="data-value">${invoice.orders?.created_at ? new Date(invoice.orders.created_at).toLocaleDateString('pt-PT') : new Date().toLocaleDateString('pt-PT')}</span>
                </div>
              </div>
            </div>

            <div class="reference-highlight">
              <div class="reference-title">📊 Detalhes da Referência</div>
              <div class="reference-details">
                <div class="reference-item">
                  <div class="reference-item-label">Entidade</div>
                  <div class="reference-item-value">11533</div>
                </div>
                <div class="reference-item">
                  <div class="reference-item-label">Referência</div>
                  <div class="reference-item-value">${paymentReference || '566282622'}</div>
                </div>
                <div class="reference-item">
                  <div class="reference-item-label">Valor a Pagar</div>
                  <div class="reference-item-value amount-value">${amount.toLocaleString('pt-PT', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} AOA</div>
                </div>
              </div>
            </div>

            <div class="instructions">
              <div class="instructions-title">
                💳 Instruções de Pagamento
              </div>
              
              <div class="instruction-step">
                <div class="step-number">1</div>
                <div class="step-text">Acesse seu aplicativo bancário, terminal ATM ou agente Multicaixa</div>
              </div>
              
              <div class="instruction-step">
                <div class="step-number">2</div>
                <div class="step-text">Selecione a opção <strong>"Pagamento de Serviços"</strong> ou <strong>"Multicaixa"</strong></div>
              </div>
              
              <div class="instruction-step">
                <div class="step-number">3</div>
                <div class="step-text">Digite a <strong>Entidade: 11533</strong></div>
              </div>
              
              <div class="instruction-step">
                <div class="step-number">4</div>
                <div class="step-text">Digite a <strong>Referência: ${paymentReference || '566282622'}</strong></div>
              </div>
              
              <div class="instruction-step">
                <div class="step-number">5</div>
                <div class="step-text">Confirme o valor: <strong>${amount.toLocaleString('pt-PT', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })} AOA</strong></div>
              </div>
              
              <div class="instruction-step">
                <div class="step-number">6</div>
                <div class="step-text">Complete o pagamento e guarde o comprovativo</div>
              </div>
            </div>

            <div class="security-note">
              <div class="security-note-title">🔒 Nota de Segurança</div>
              <div class="security-note-text">
                Este documento é válido apenas para o pagamento da fatura especificada. 
                Verifique sempre os dados antes de confirmar o pagamento.
              </div>
            </div>

            <div class="footer">
              <div class="company-info">
                <div class="company-name">AngoHost - Prestação de Serviços, Lda</div>
                <div class="company-details">
                  Email: support@angohost.ao | Telefone: +244 942 090 108<br>
                  Endereço: Rua Principal, 123, Luanda - Angola<br>
                  NIF: 5000000000 | Regime Geral
                </div>
              </div>
              <div class="certification">
                Documento gerado eletronicamente e certificado pela AGT (Administração Geral Tributária)<br>
                Data/Hora de emissão: ${new Date().toLocaleString('pt-PT')} | Válido sem assinatura
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
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
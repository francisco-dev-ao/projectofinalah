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

      // HTML para fatura pró-forma profissional
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fatura Pró-forma - AngoHost</title>
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
              font-size: 13px;
            }
            
            .invoice {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20mm;
              background: white;
              min-height: 297mm;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #1e40af;
            }
            
            .company-info {
              flex: 1;
            }
            
            .company-logo {
              font-size: 28px;
              font-weight: 900;
              color: #1e40af;
              margin-bottom: 10px;
              letter-spacing: -1px;
            }
            
            .company-details {
              color: #64748b;
              line-height: 1.6;
            }
            
            .invoice-info {
              text-align: right;
              flex: 1;
            }
            
            .invoice-title {
              font-size: 24px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 10px;
            }
            
            .invoice-meta {
              color: #64748b;
              line-height: 1.6;
            }
            
            .client-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin: 30px 0;
              padding: 25px;
              background: #f8fafc;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #dbeafe;
            }
            
            .info-line {
              margin-bottom: 8px;
              display: flex;
              align-items: flex-start;
            }
            
            .info-label {
              font-weight: 600;
              color: #475569;
              min-width: 80px;
              margin-right: 10px;
            }
            
            .info-value {
              color: #1e293b;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .items-table th {
              background: #1e40af;
              color: white;
              padding: 15px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .items-table td {
              padding: 15px 12px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
            }
            
            .items-table tr:last-child td {
              border-bottom: none;
            }
            
            .items-table tr:nth-child(even) {
              background: #f8fafc;
            }
            
            .text-right {
              text-align: right;
            }
            
            .text-center {
              text-align: center;
            }
            
            .totals-section {
              display: flex;
              justify-content: flex-end;
              margin: 30px 0;
            }
            
            .totals-table {
              width: 400px;
              border-collapse: collapse;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .totals-table td {
              padding: 12px 20px;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .totals-table tr:last-child td {
              border-bottom: none;
              background: #1e40af;
              color: white;
              font-weight: 700;
              font-size: 16px;
            }
            
            .totals-label {
              font-weight: 600;
              color: #475569;
            }
            
            .totals-value {
              text-align: right;
              font-weight: 600;
              color: #1e293b;
            }
            
            .payment-reference {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 25px;
              border-radius: 16px;
              margin: 30px 0;
              text-align: center;
            }
            
            .reference-title {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 20px;
              opacity: 0.95;
            }
            
            .reference-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-top: 20px;
            }
            
            .reference-item {
              background: rgba(255, 255, 255, 0.15);
              padding: 15px;
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            
            .reference-label {
              font-size: 11px;
              opacity: 0.8;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .reference-value {
              font-size: 16px;
              font-weight: 700;
            }
            
            .amount-highlight {
              font-size: 20px;
            }
            
            .observation {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
              text-align: center;
            }
            
            .observation-title {
              font-weight: 700;
              color: #92400e;
              margin-bottom: 10px;
              font-size: 14px;
            }
            
            .observation-text {
              color: #a16207;
              font-style: italic;
            }
            
            .footer {
              margin-top: 50px;
              padding-top: 25px;
              border-top: 2px solid #e2e8f0;
              text-align: center;
              color: #64748b;
              font-size: 11px;
            }
            
            .footer-company {
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 8px;
            }
            
            @media print {
              body { 
                margin: 0;
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .invoice { 
                margin: 0; 
                padding: 15mm;
                min-height: auto;
              }
              .no-print { 
                display: none !important; 
              }
            }
            
            @page {
              margin: 0;
              size: A4;
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <div class="company-info">
                <div class="company-logo">AngoHost</div>
                <div class="company-details">
                  <strong>ANGOHOST - PRESTAÇÃO DE SERVIÇOS, LDA</strong><br>
                  Cacuaco Sequele<br>
                  Email: support@angohost.ao<br>
                  NIF: 5000088927<br>
                  Telefone: +244 226 430 401
                </div>
              </div>
              <div class="invoice-info">
                <div class="invoice-title">FATURA PRÓ-FORMA</div>
                <div class="invoice-meta">
                  <strong>Nº:</strong> PRO-${invoiceNumber}<br>
                  <strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-PT')}<br>
                  <strong>Data de Vencimento:</strong> ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('pt-PT')}
                </div>
              </div>
            </div>

            <div class="client-section">
              <div>
                <div class="section-title">Dados da Empresa</div>
                <div class="info-line">
                  <span class="info-label">Empresa:</span>
                  <span class="info-value">ANGOHOST - PRESTAÇÃO DE SERVIÇOS, LDA</span>
                </div>
                <div class="info-line">
                  <span class="info-label">Endereço:</span>
                  <span class="info-value">Cacuaco Sequele</span>
                </div>
                <div class="info-line">
                  <span class="info-label">Email:</span>
                  <span class="info-value">support@angohost.ao</span>
                </div>
                <div class="info-line">
                  <span class="info-label">NIF:</span>
                  <span class="info-value">5000088927</span>
                </div>
              </div>
              <div>
                <div class="section-title">Dados do Cliente</div>
                <div class="info-line">
                  <span class="info-label">Cliente:</span>
                  <span class="info-value">${invoice.orders?.customer_name || 'Cliente'}</span>
                </div>
                <div class="info-line">
                  <span class="info-label">Endereço:</span>
                  <span class="info-value">${invoice.orders?.billing_address || 'N/A'}</span>
                </div>
                <div class="info-line">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${invoice.orders?.customer_email || 'N/A'}</span>
                </div>
                <div class="info-line">
                  <span class="info-label">Telefone:</span>
                  <span class="info-value">${invoice.orders?.customer_phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th class="text-center">Qtd</th>
                  <th class="text-right">Preço Unitário</th>
                  <th class="text-right">Desconto</th>
                  <th class="text-right">Retenção</th>
                  <th class="text-right">Imposto</th>
                  <th class="text-center">Cód. Imposto</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.orders?.order_items?.map(item => `
                  <tr>
                    <td>${item.product_name || 'Serviço'}</td>
                    <td class="text-center">1</td>
                    <td class="text-right">${(item.price || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} AOA</td>
                    <td class="text-right">0,00 AOA</td>
                    <td class="text-right">0,00 AOA</td>
                    <td class="text-right">14%</td>
                    <td class="text-center">IVA</td>
                    <td class="text-right">${(item.price || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} AOA</td>
                  </tr>
                `).join('') || `
                  <tr>
                    <td>Serviço de Hospedagem</td>
                    <td class="text-center">1</td>
                    <td class="text-right">${amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} AOA</td>
                    <td class="text-right">0,00 AOA</td>
                    <td class="text-right">0,00 AOA</td>
                    <td class="text-right">14%</td>
                    <td class="text-center">IVA</td>
                    <td class="text-right">${amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} AOA</td>
                  </tr>
                `}
              </tbody>
            </table>

            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td class="totals-label">Total Ilíquido:</td>
                  <td class="totals-value">${(amount * 0.877).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} AOA</td>
                </tr>
                <tr>
                  <td class="totals-label">Desconto:</td>
                  <td class="totals-value">0,00 AOA</td>
                </tr>
                <tr>
                  <td class="totals-label">IVA (14%):</td>
                  <td class="totals-value">${(amount * 0.123).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} AOA</td>
                </tr>
                <tr>
                  <td class="totals-label">Retenção:</td>
                  <td class="totals-value">0,00 AOA</td>
                </tr>
                <tr>
                  <td class="totals-label">Total a Pagar:</td>
                  <td class="totals-value">${amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} AOA</td>
                </tr>
              </table>
            </div>

            <div class="payment-reference">
              <div class="reference-title">📊 Referência de Pagamento Multicaixa</div>
              <div class="reference-grid">
                <div class="reference-item">
                  <div class="reference-label">Entidade</div>
                  <div class="reference-value">11533</div>
                </div>
                <div class="reference-item">
                  <div class="reference-label">Referência</div>
                  <div class="reference-value">${paymentReference || '566282622'}</div>
                </div>
                <div class="reference-item">
                  <div class="reference-label">Valor</div>
                  <div class="reference-value amount-highlight">${amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} AOA</div>
                </div>
              </div>
            </div>

            <div class="observation">
              <div class="observation-title">⚠️ OBSERVAÇÃO IMPORTANTE</div>
              <div class="observation-text">
                Este documento não serve de fatura. Após o pagamento receberá a fatura final.
              </div>
            </div>

            <div class="footer">
              <div class="footer-company">ANGOHOST - PRESTAÇÃO DE SERVIÇOS, LDA</div>
              <div>
                Documento gerado eletronicamente em ${new Date().toLocaleString('pt-PT')}<br>
                Este documento é uma pró-forma e não tem valor fiscal até confirmação do pagamento
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
      
      toast.success('Fatura pró-forma aberta para impressão!');
      
    } catch (error) {
      console.error('Error printing reference:', error);
      toast.error('Erro ao preparar impressão da fatura');
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
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, CheckCircle, Clock, CreditCard, Smartphone, Building2, Banknote, Printer, Loader2, Download, FileText, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
// Print reference system removed

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

interface AppyPayReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentReference: PaymentReference;
}

export const AppyPayReferenceModal = ({ 
  isOpen, 
  onClose, 
  paymentReference 
}: AppyPayReferenceModalProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [generatingReferencePDF, setGeneratingReferencePDF] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<{name?: string, email?: string, phone?: string}>({});
  const [orderData, setOrderData] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Carregar informações do cliente e dados do pedido
  useEffect(() => {
    const loadOrderData = async () => {
      try {
        const { data: order, error } = await supabase
          .from("orders")
          .select(`
            *,
            profiles:user_id (name, email, phone),
            order_items (*)
          `)
          .eq("id", paymentReference.order_id)
          .single();
          
        if (!error && order) {
          // Definir dados do cliente
          if (order.profiles) {
            setCustomerInfo({
              name: order.profiles.name,
              email: order.profiles.email,
              phone: order.profiles.phone
            });
          }
          
          // Definir dados completos do pedido
          setOrderData(order);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do pedido:', error);
      }
    };
    
    if (paymentReference?.order_id) {
      loadOrderData();
    }
  }, [paymentReference?.order_id]);

  // Calculate time remaining
  useEffect(() => {
    if (!paymentReference?.validity_date) return;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const validityTime = new Date(paymentReference.validity_date).getTime();
      const difference = validityTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days} dias, ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      } else {
        setTimeLeft('Expirado');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [paymentReference?.validity_date]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'atm':
        return <CreditCard className="h-4 w-4" />;
      case 'multicaixa express':
        return <Smartphone className="h-4 w-4" />;
      case 'internet banking':
        return <Building2 className="h-4 w-4" />;
      case 'balcão bancário':
        return <Banknote className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  // Handler para imprimir referência de pagamento
  const handlePrintReference = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Não foi possível abrir a janela de impressão');
        return;
      }

      // HTML para impressão da referência - Design profissional
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Referência de Pagamento - AngoHost</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #2d3748;
              background: #f7fafc;
              padding: 40px 20px;
            }
            
            .document {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              position: relative;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
              opacity: 0.3;
            }
            
            .header-content {
              position: relative;
              z-index: 1;
            }
            
            .company-logo {
              display: flex;
              align-items: center;
              gap: 15px;
              margin-bottom: 20px;
            }
            
            .logo-icon {
              width: 50px;
              height: 50px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
            }
            
            .company-name {
              font-size: 32px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            
            .document-type {
              font-size: 18px;
              opacity: 0.9;
              font-weight: 300;
            }
            
            .content {
              padding: 40px;
            }
            
            .info-section {
              margin-bottom: 20px;
            }
            
            .info-title {
              font-size: 18px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e2e8f0;
            }
            
            .info-card {
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .info-item {
              margin-bottom: 15px;
            }
            
            .info-item:last-child {
              margin-bottom: 0;
            }
            
            .info-label {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #718096;
              margin-bottom: 5px;
            }
            
            .info-value {
              font-size: 14px;
              font-weight: 500;
              color: #2d3748;
              line-height: 1.4;
            }
            
            .reference-section {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border: 2px solid #e2e8f0;
              border-radius: 16px;
              padding: 30px;
              margin-bottom: 30px;
              position: relative;
            }
            
            .reference-section::before {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              border-radius: 16px;
              z-index: -1;
            }
            
            .section-title {
              font-size: 22px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 25px;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            
            .section-title::before {
              content: '💳';
              font-size: 24px;
            }
            
            .reference-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 25px;
            }
            
            .reference-item {
              background: white;
              padding: 20px;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              transition: all 0.2s;
            }
            
            .reference-item:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            
            .item-label {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #718096;
              margin-bottom: 8px;
            }
            
            .item-value {
              font-size: 18px;
              font-weight: 600;
              color: #2d3748;
              word-break: break-word;
            }
            
            .amount-highlight {
              background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
              color: white !important;
              font-size: 24px !important;
              text-align: center;
              padding: 25px !important;
              border-radius: 16px !important;
              border: none !important;
              grid-column: 1 / -1;
              position: relative;
              overflow: hidden;
            }
            
            .amount-highlight::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
              animation: shine 2s infinite;
            }
            
            @keyframes shine {
              0% { left: -100%; }
              100% { left: 100%; }
            }
            
            .instructions-section {
              background: #f7fafc;
              border-radius: 16px;
              padding: 30px;
              margin: 30px 0;
            }
            
            .instructions-title {
              font-size: 20px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            
            .instructions-title::before {
              content: '📋';
              font-size: 20px;
            }
            
            .instructions-list {
              list-style: none;
              padding: 0;
            }
            
            .instruction-item {
              background: white;
              margin-bottom: 12px;
              padding: 16px 20px;
              border-radius: 10px;
              border-left: 4px solid #667eea;
              display: flex;
              align-items: center;
              gap: 15px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .step-number {
              background: #667eea;
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 14px;
              flex-shrink: 0;
            }
            
            .channels-section {
              background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
              border-radius: 16px;
              padding: 25px;
              margin: 25px 0;
            }
            
            .channels-title {
              font-size: 18px;
              font-weight: 600;
              color: #234e52;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .channels-title::before {
              content: '🏦';
              font-size: 18px;
            }
            
            .channels-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 12px;
            }
            
            .channel-item {
              background: white;
              padding: 12px 16px;
              border-radius: 8px;
              font-weight: 500;
              color: #234e52;
              text-align: center;
              border: 1px solid #81e6d9;
            }
            
            .footer {
              background: #2d3748;
              color: #e2e8f0;
              padding: 30px 40px;
              text-align: center;
            }
            
            .footer-content {
              max-width: 600px;
              margin: 0 auto;
            }
            
            .company-details {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 10px;
            }
            
            .contact-info {
              font-size: 14px;
              opacity: 0.8;
              margin-bottom: 15px;
            }
            
            .timestamp {
              font-size: 12px;
              opacity: 0.6;
              font-style: italic;
            }
            
            .security-note {
              background: #fef5e7;
              border: 1px solid #f6e05e;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            
            .security-note-title {
              font-weight: 600;
              color: #744210;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }
            
            .security-note-title::before {
              content: '🔒';
            }
            
            .security-note-text {
              font-size: 14px;
              color: #744210;
            }
            
            @media print {
              body {
                background: white;
                padding: 0;
              }
              
              .document {
                box-shadow: none;
                border-radius: 0;
              }
              
              .reference-item:hover {
                transform: none;
                box-shadow: none;
              }
              
              .amount-highlight::before {
                animation: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="document">
            <div class="header">
              <div class="header-content">
                <div class="company-logo">
                  <div class="logo-icon">AH</div>
                  <div>
                    <div class="company-name">AngoHost</div>
                    <div class="document-type">Referência de Pagamento Multicaixa</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="content">
              <!-- Dados da Empresa e Cliente -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                <div class="info-section">
                  <div class="info-title">Dados da Empresa</div>
                  <div class="info-card">
                    <div class="info-item">
                      <div class="info-label">Razão Social</div>
                      <div class="info-value">AngoHost, Lda</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">NIF</div>
                      <div class="info-value">5000000000</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Endereço</div>
                      <div class="info-value">Rua Principal, 123<br>Luanda, Angola</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Contactos</div>
                      <div class="info-value">
                        📧 support@angohost.ao<br>
                        📞 +244 942 090 108<br>
                        🌐 www.angohost.ao
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="info-section">
                  <div class="info-title">Dados do Cliente</div>
                  <div class="info-card">
                    <div class="info-item">
                      <div class="info-label">Nome</div>
                      <div class="info-value">${customerInfo.name || 'Cliente'}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Email</div>
                      <div class="info-value">${customerInfo.email || 'Não informado'}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Telefone</div>
                      <div class="info-value">${customerInfo.phone || 'Não informado'}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Data do Pedido</div>
                      <div class="info-value">${new Date().toLocaleDateString('pt-PT', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="reference-section">
                <div class="section-title">Detalhes da Referência</div>
                <div class="reference-grid">
                  <div class="reference-item">
                    <div class="item-label">Entidade</div>
                    <div class="item-value">${paymentReference.entity}</div>
                  </div>
                  <div class="reference-item">
                    <div class="item-label">Referência</div>
                    <div class="item-value">${paymentReference.reference}</div>
                  </div>
                  <div class="reference-item amount-highlight">
                    <div class="item-label" style="color: rgba(255,255,255,0.9); margin-bottom: 5px;">Valor a Pagar</div>
                    <div class="item-value">${paymentReference.amount.toLocaleString('pt-PT', { 
                      style: 'currency', 
                      currency: 'AOA' 
                    })}</div>
                  </div>
                  <div class="reference-item">
                    <div class="item-label">Descrição</div>
                    <div class="item-value">${paymentReference.description}</div>
                  </div>
                  <div class="reference-item">
                    <div class="item-label">Data de Emissão</div>
                    <div class="item-value">${new Date().toLocaleDateString('pt-PT', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</div>
                  </div>
                  <div class="reference-item">
                    <div class="item-label">Validade</div>
                    <div class="item-value">${paymentReference.validity_date ? 
                      new Date(paymentReference.validity_date).toLocaleDateString('pt-PT', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      }) : 'Sem prazo de validade'}</div>
                  </div>
                </div>
              </div>

              ${paymentReference.payment_channels?.length ? `
              <div class="channels-section">
                <div class="channels-title">Canais de Pagamento Disponíveis</div>
                <div class="channels-grid">
                  ${paymentReference.payment_channels.map(channel => `
                    <div class="channel-item">${channel}</div>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              <div class="instructions-section">
                <div class="instructions-title">Como Efetuar o Pagamento</div>
                <ol class="instructions-list">
                  ${paymentReference.instructions?.pt?.steps?.map((step, index) => `
                    <li class="instruction-item">
                      <div class="step-number">${index + 1}</div>
                      <div>${step}</div>
                    </li>
                  `).join('') || `
                    <li class="instruction-item">
                      <div class="step-number">1</div>
                      <div>Acesse seu aplicativo bancário ou terminal ATM</div>
                    </li>
                    <li class="instruction-item">
                      <div class="step-number">2</div>
                      <div>Selecione a opção "Pagamento de Serviços" ou "Multicaixa"</div>
                    </li>
                    <li class="instruction-item">
                      <div class="step-number">3</div>
                      <div>Digite a entidade: <strong>${paymentReference.entity}</strong></div>
                    </li>
                    <li class="instruction-item">
                      <div class="step-number">4</div>
                      <div>Digite a referência: <strong>${paymentReference.reference}</strong></div>
                    </li>
                    <li class="instruction-item">
                      <div class="step-number">5</div>
                      <div>Confirme o valor: <strong>${paymentReference.amount.toLocaleString('pt-PT', { style: 'currency', currency: 'AOA' })}</strong></div>
                    </li>
                    <li class="instruction-item">
                      <div class="step-number">6</div>
                      <div>Finalize o pagamento e guarde o comprovativo</div>
                    </li>
                  `}
                </ol>
              </div>

              <div class="security-note">
                <div class="security-note-title">Pagamento Seguro</div>
                <div class="security-note-text">
                  Esta referência é válida e segura. Guarde este documento até a confirmação do pagamento.
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-content">
                <div class="company-details">AngoHost - Soluções em Hospedagem e Domínios</div>
                <div class="contact-info">
                  📧 support@angohost.ao | 📞 +244 942 090 108 | 🌐 www.angohost.ao
                </div>
                <div class="timestamp">
                  Documento gerado eletronicamente em ${new Date().toLocaleString('pt-PT', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 800);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      toast.success('Documento de referência aberto para impressão!');
      
    } catch (error) {
      console.error('Erro ao imprimir referência:', error);
      toast.error('Erro ao preparar impressão da referência');
    }
  };

  // Handler para enviar email usando SMTP direto
  const handleSendEmail = async () => {
    if (!customerInfo.email) {
      toast.error('Email do cliente não encontrado');
      return;
    }

    setSendingEmail(true);
    
    try {
      // Dados do email
      const emailData = {
        to: customerInfo.email,
        customerName: customerInfo.name || 'Cliente',
        entity: paymentReference.entity,
        reference: paymentReference.reference,
        amount: paymentReference.amount.toLocaleString('pt-PT', { 
          style: 'currency', 
          currency: 'AOA' 
        }),
        description: paymentReference.description,
        validityDate: formatDate(paymentReference.validity_date),
        instructions: paymentReference.instructions.pt.steps
      };

      console.log('Tentando enviar email para:', customerInfo.email);
      console.log('Dados do email:', emailData);

      // Tentar usar a Edge Function primeiro
      try {
        const { data, error } = await supabase.functions.invoke('send-smtp-email', {
          body: emailData
        });

        if (error) {
          console.error('Erro na Edge Function:', error);
          throw new Error(`Erro na Edge Function: ${error.message}`);
        }

        console.log('Resposta da Edge Function:', data);
        toast.success(`Email enviado automaticamente para ${customerInfo.email}`);
        return;
        
      } catch (edgeError) {
        console.error('Edge Function falhou:', edgeError);
        
        // Usar serviço alternativo SMTP
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            smtp: {
              host: 'mail.angohost.ao',
              port: 587,
              secure: false,
              auth: {
                user: 'support@angohost.ao',
                pass: '97z2lh;F4_k5'
              }
            },
            email: {
              from: 'support@angohost.ao',
              to: customerInfo.email,
              subject: 'Referência de Pagamento Multicaixa - AngoHost',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">AngoHost</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Referência de Pagamento Multicaixa</p>
                  </div>
                  
                  <div style="padding: 30px;">
                    <p style="font-size: 18px; margin-bottom: 20px;">Olá ${emailData.customerName},</p>
                    
                    <p>Sua referência de pagamento foi gerada com sucesso:</p>
                    
                    <div style="background: #f7fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                      <h2 style="color: #2d3748; margin-bottom: 20px;">💳 Dados para Pagamento</h2>
                      
                      <div style="margin-bottom: 20px;">
                        <div style="display: inline-block; background: white; padding: 15px; margin: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                          <div style="font-size: 12px; font-weight: 600; color: #718096; margin-bottom: 5px;">ENTIDADE</div>
                          <div style="font-size: 20px; font-weight: 600; color: #2d3748;">${emailData.entity}</div>
                        </div>
                        
                        <div style="display: inline-block; background: white; padding: 15px; margin: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                          <div style="font-size: 12px; font-weight: 600; color: #718096; margin-bottom: 5px;">REFERÊNCIA</div>
                          <div style="font-size: 20px; font-weight: 600; color: #2d3748;">${emailData.reference}</div>
                        </div>
                      </div>
                      
                      <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <div style="font-size: 14px; margin-bottom: 5px;">VALOR A PAGAR</div>
                        <div style="font-size: 28px; font-weight: 700;">${emailData.amount}</div>
                      </div>
                      
                      <p><strong>Descrição:</strong> ${emailData.description}</p>
                      <p><strong>Válido até:</strong> ${emailData.validityDate}</p>
                    </div>
                    
                    <div style="background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <h3 style="color: #22543d; margin-bottom: 15px;">📋 Como Pagar</h3>
                      ${emailData.instructions.map((step, index) => `
                        <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 6px; border-left: 4px solid #48bb78;">
                          <strong>${index + 1}.</strong> ${step}
                        </div>
                      `).join('')}
                    </div>
                    
                    <p>Após o pagamento, você receberá a confirmação e a fatura final.</p>
                  </div>
                  
                  <div style="background: #2d3748; color: #e2e8f0; padding: 25px; text-align: center;">
                    <div style="font-weight: 600; margin-bottom: 5px;">ANGOHOST - PRESTAÇÃO DE SERVIÇOS, LDA</div>
                    <div style="font-size: 14px;">
                      Email: support@angohost.ao | Telefone: +244 226 430 401<br>
                      Cacuaco Sequele - Angola | NIF: 5000088927
                    </div>
                  </div>
                </div>
              `
            }
          })
        });

        if (response.ok) {
          toast.success(`Email enviado automaticamente para ${customerInfo.email}`);
        } else {
          throw new Error('Serviço de email indisponível');
        }
      }
      
    } catch (error) {
      console.error('Erro completo ao enviar email:', error);
      toast.error(`Erro ao enviar email automaticamente: ${error.message || 'Serviço temporariamente indisponível'}`);
    } finally {
      setSendingEmail(false);
    }
  };


  if (!paymentReference) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto p-0">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="bg-white/20 p-2 rounded-full">
                <CheckCircle className="h-6 w-6" />
              </div>
              Referência de Pagamento Gerada
            </DialogTitle>
            <p className="text-green-100 mt-2">
              Sua referência multicaixa foi criada com sucesso
            </p>
          </DialogHeader>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Action Buttons na parte superior */}
          <div className="flex flex-col gap-3">
            {/* Botões de referência de pagamento */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handlePrintReference}
                className="flex-1 border-blue-300 hover:bg-blue-50"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Referência
              </Button>
            </div>
          </div>

          {/* Seção de Email */}
          <Card className="border-purple-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                Enviar por Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                <div>
                  <p className="text-sm font-medium text-purple-800">Cliente:</p>
                  <p className="text-purple-700">{customerInfo.name || 'Nome não informado'}</p>
                  <p className="text-sm text-purple-600">{customerInfo.email || 'Email não informado'}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !customerInfo.email}
                    variant="outline"
                    className="bg-purple-100 hover:bg-purple-200 border-purple-300"
                  >
                    {sendingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Enviar Email
                  </Button>
                </div>
              </div>
              
              {!customerInfo.email && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Email do cliente não encontrado. Verifique se o cliente tem email cadastrado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator className="my-6" />

          {/* Nota sobre fatura final */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full mt-0.5">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Fatura Final</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Após o pagamento, a fatura final certificada pela AGT chegará automaticamente ao seu email.
                </p>
              </div>
            </div>
          </div>

          {/* Status compacto */}
          <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Válida por {timeLeft}</p>
                <p className="text-sm text-green-600">
                  Expira em {formatDate(paymentReference.validity_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-white border-green-300 text-green-700">
                Pedido #{paymentReference.order_id.substring(0, 8)}
              </Badge>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Fatura Registrada
              </Badge>
            </div>
          </div>

          {/* Payment Details Card - Layout melhorado */}
          <Card className="border-2 border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <CardTitle className="text-lg text-center text-green-800 flex items-center justify-center gap-2">
                <img 
                  src="/lovable-uploads/f8d6177e-8235-4942-af13-8da5c89452a9.png" 
                  alt="Multicaixa" 
                  className="h-6 w-6 object-contain"
                />
                Dados para Pagamento Multicaixa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4">
                {/* Entity */}
                <div className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors p-4 rounded-xl border">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Entidade</p>
                    <p className="text-2xl font-mono font-bold text-gray-900">{paymentReference.entity}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentReference.entity, 'Entidade')}
                    className="ml-4 hover:bg-green-50 hover:border-green-300"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Reference */}
                <div className="flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-xl border border-blue-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-600 mb-1">Referência</p>
                    <p className="text-2xl font-mono font-bold text-blue-900">{paymentReference.reference}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentReference.reference, 'Referência')}
                    className="ml-4 hover:bg-blue-100 hover:border-blue-300"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between bg-green-50 hover:bg-green-100 transition-colors p-4 rounded-xl border border-green-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600 mb-1">Valor</p>
                    <p className="text-2xl font-bold text-green-800">
                      {paymentReference.amount.toLocaleString('pt-AO')} AOA
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentReference.amount.toString(), 'Valor')}
                    className="ml-4 hover:bg-green-100 hover:border-green-300"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Channels - Design melhorado */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Onde Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {paymentReference.payment_channels.map((channel, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-sm transition-all">
                    <div className="bg-blue-100 p-2 rounded-full">
                      {getChannelIcon(channel)}
                    </div>
                    <span className="text-sm font-medium text-blue-800">{channel}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructions - Layout melhorado */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {paymentReference.instructions.pt.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border">
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  {paymentReference.instructions.pt.steps.map((step, index) => (
                    <li key={index} className="text-gray-700 leading-relaxed pl-2">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              
              <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">Importante</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {paymentReference.instructions.pt.note}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão de fechar no final */}
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-8"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
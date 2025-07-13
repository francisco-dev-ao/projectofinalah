import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Send, CheckCircle, AlertTriangle, User, Bell } from 'lucide-react';
import EmailAutomationService from '@/services/emailAutomationService';

export const EmailTestPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const handleSendWelcomeEmail = async () => {
    if (!testEmail || !customerName) {
      toast.error('Por favor, preencha email e nome');
      return;
    }

    setIsLoading(true);
    try {
      const { EmailService } = await import('@/services/emailService');
      const result = await EmailService.sendWelcomeEmail(testEmail, customerName);
      
      if (result.success) {
        toast.success('Email de boas-vindas enviado!');
      } else {
        toast.error(result.error || 'Erro ao enviar email');
      }
    } catch (error) {
      toast.error('Erro ao enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPaymentConfirmation = async () => {
    if (!testEmail || !customerName) {
      toast.error('Por favor, preencha email e nome');
      return;
    }

    setIsLoading(true);
    try {
      const { EmailService } = await import('@/services/emailService');
      const result = await EmailService.sendPaymentConfirmationEmail(
        testEmail,
        customerName,
        'ORDER-12345',
        50000, // 50,000 AOA
        'AppyPay'
      );
      
      if (result.success) {
        toast.success('Email de confirmação de pagamento enviado!');
      } else {
        toast.error(result.error || 'Erro ao enviar email');
      }
    } catch (error) {
      toast.error('Erro ao enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOverdueNotice = async () => {
    if (!testEmail || !customerName) {
      toast.error('Por favor, preencha email e nome');
      return;
    }

    setIsLoading(true);
    try {
      const { EmailService } = await import('@/services/emailService');
      const result = await EmailService.sendOverdueInvoiceEmail(
        testEmail,
        customerName,
        'INV-2024-001',
        75000, // 75,000 AOA
        5 // 5 dias de atraso
      );
      
      if (result.success) {
        toast.success('Email de fatura em atraso enviado!');
      } else {
        toast.error(result.error || 'Erro ao enviar email');
      }
    } catch (error) {
      toast.error('Erro ao enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!testEmail || !customerName) {
      toast.error('Por favor, preencha email e nome');
      return;
    }

    setIsLoading(true);
    try {
      const result = await EmailAutomationService.triggerVerificationCode(testEmail, customerName);
      
      if (result.success) {
        setVerificationCode((result as any).verificationCode || '');
        toast.success('Código de verificação enviado!');
      } else {
        toast.error(result.error || 'Erro ao enviar código');
      }
    } catch (error) {
      toast.error('Erro ao enviar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendDataUpdateConfirmation = async () => {
    if (!testEmail || !customerName) {
      toast.error('Por favor, preencha email e nome');
      return;
    }

    setIsLoading(true);
    try {
      const result = await EmailAutomationService.triggerDataUpdateConfirmation(
        testEmail,
        customerName,
        ['Nome', 'Telefone', 'Endereço']
      );
      
      if (result.success) {
        toast.success('Email de confirmação de atualização enviado!');
      } else {
        toast.error(result.error || 'Erro ao enviar email');
      }
    } catch (error) {
      toast.error('Erro ao enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAdminNotification = async () => {
    setIsLoading(true);
    try {
      const result = await EmailAutomationService.triggerAdminTicketNotification(
        'TICKET-12345',
        customerName || 'Cliente Teste',
        testEmail || 'cliente@example.com',
        'Problema com hospedagem',
        'Alta'
      );
      
      if (result.success) {
        toast.success('Notificação para admin enviada!');
      } else {
        toast.error(result.error || 'Erro ao enviar notificação');
      }
    } catch (error) {
      toast.error('Erro ao enviar notificação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Sistema de Emails Automáticos - AngoHost
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="testEmail">Email de Teste</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="teste@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="customerName">Nome do Cliente</Label>
            <Input
              id="customerName"
              placeholder="João Silva"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer">Emails de Cliente</TabsTrigger>
            <TabsTrigger value="billing">Faturação</TabsTrigger>
            <TabsTrigger value="admin">Administrativos</TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-4 w-4" />
                    Boas-vindas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Email enviado automaticamente quando um novo cliente se registra.
                  </p>
                  <Button
                    onClick={handleSendWelcomeEmail}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Boas-vindas
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-4 w-4" />
                    Confirmação de Dados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Enviado quando o cliente atualiza dados da conta.
                  </p>
                  <Button
                    onClick={handleSendDataUpdateConfirmation}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Confirmação
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Código de Verificação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Código de 6 dígitos para verificação de identidade.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendVerificationCode}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Código
                  </Button>
                  {verificationCode && (
                    <Input
                      value={verificationCode}
                      readOnly
                      className="w-32 text-center font-mono"
                      placeholder="Código"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Pagamento Confirmado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Enviado quando um pagamento é processado com sucesso.
                  </p>
                  <Button
                    onClick={handleSendPaymentConfirmation}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Pagamento
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Fatura em Atraso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Notificação automática para faturas vencidas.
                  </p>
                  <Button
                    onClick={handleSendOverdueNotice}
                    disabled={isLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Aviso de Atraso
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificação de Ticket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Notifica administradores sobre novos tickets de suporte.
                </p>
                <Button
                  onClick={handleSendAdminNotification}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notificar Admins
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">📋 Funcionalidades Implementadas:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 text-sm text-blue-800">
            <ul className="space-y-1">
              <li>✅ Email de boas-vindas</li>
              <li>✅ Confirmação de pagamento</li>
              <li>✅ Referência de pagamento AppyPay</li>
              <li>✅ Fatura em atraso</li>
            </ul>
            <ul className="space-y-1">
              <li>✅ Notificação de ticket para admin</li>
              <li>✅ Confirmação de atualização de dados</li>
              <li>✅ Código de verificação</li>
              <li>✅ Reset de senha</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTestPanel;
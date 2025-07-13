import { EmailService } from '@/services/emailService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Sistema de automação de emails para AngoHost
 * Centraliza todos os disparos automáticos de email
 */
export class EmailAutomationService {
  
  /**
   * Dispara email de confirmação de pagamento
   */
  static async triggerPaymentConfirmation(
    orderId: string,
    amount: number,
    paymentMethod: string = 'AppyPay'
  ) {
    try {
      console.log('🔄 Disparando email de confirmação de pagamento...');
      
      // Buscar dados do pedido
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (name, email)
        `)
        .eq('id', orderId)
        .single();

      if (error || !order) {
        console.error('Erro ao buscar dados do pedido:', error);
        return { success: false, error: 'Pedido não encontrado' };
      }

      const customerEmail = order.profiles?.email;
      const customerName = order.profiles?.name || 'Cliente';
      const customerPhone = order.profiles?.phone;

      if (!customerEmail) {
        console.error('Email do cliente não encontrado');
        return { success: false, error: 'Email do cliente não encontrado' };
      }

      // Enviar confirmação por email e SMS em paralelo
      const { SMSService } = await import('@/services/smsService');
      
      const [emailResult, smsResult] = await Promise.allSettled([
        EmailService.sendPaymentConfirmationEmail(
          customerEmail,
          customerName,
          orderId,
          amount,
          paymentMethod
        ),
        customerPhone ? SMSService.sendPaymentNotification(customerPhone, orderId, amount) 
          : Promise.resolve({ success: false, error: 'Telefone não disponível' })
      ]);

      let overallSuccess = false;
      let messages = [];

      if (emailResult.status === 'fulfilled' && emailResult.value.success) {
        console.log('✅ Email de confirmação de pagamento enviado com sucesso');
        overallSuccess = true;
        messages.push('Email enviado');
      }

      if (smsResult.status === 'fulfilled' && smsResult.value.success && customerPhone) {
        console.log('✅ SMS de confirmação de pagamento enviado com sucesso');
        overallSuccess = true;
        messages.push('SMS enviado');
      }

      return { 
        success: overallSuccess, 
        message: messages.length > 0 ? messages.join(' e ') : 'Nenhuma notificação enviada'
      };
    } catch (error) {
      console.error('❌ Erro ao enviar email de confirmação de pagamento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dispara email de fatura em atraso
   */
  static async triggerOverdueInvoiceNotification(invoiceId: string) {
    try {
      console.log('🔄 Verificando fatura em atraso...');
      
      // Buscar dados da fatura
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders:order_id (
            profiles:customer_id (name, email)
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error || !invoice) {
        console.error('Erro ao buscar dados da fatura:', error);
        return { success: false, error: 'Fatura não encontrada' };
      }

      const customerEmail = invoice.orders?.profiles?.email;
      const customerName = invoice.orders?.profiles?.name || 'Cliente';
      
      if (!customerEmail) {
        console.error('Email do cliente não encontrado');
        return { success: false, error: 'Email do cliente não encontrado' };
      }

      // Calcular dias de atraso
      const dueDate = new Date(invoice.due_date);
      const today = new Date();
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysPastDue <= 0) {
        console.log('Fatura ainda não está em atraso');
        return { success: false, error: 'Fatura não está em atraso' };
      }

      const result = await EmailService.sendOverdueInvoiceEmail(
        customerEmail,
        customerName,
        invoice.invoice_number,
        invoice.amount || 0,
        daysPastDue
      );

      if (result.success) {
        console.log('✅ Email de fatura em atraso enviado com sucesso');
      }

      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar email de fatura em atraso:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dispara notificação para admin sobre novo ticket
   */
  static async triggerAdminTicketNotification(
    ticketId: string,
    customerName: string,
    customerEmail: string,
    subject: string,
    priority: string = 'Média'
  ) {
    try {
      console.log('🔄 Notificando admin sobre novo ticket...');
      
      // Buscar emails dos administradores
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('email')
        .in('role', ['admin', 'suporte']);

      if (error || !admins || admins.length === 0) {
        console.error('Erro ao buscar admins:', error);
        return { success: false, error: 'Administradores não encontrados' };
      }

      const results = [];
      
      // Enviar email para todos os admins
      for (const admin of admins) {
        if (admin.email) {
          const result = await EmailService.sendAdminTicketNotification(
            admin.email,
            customerName,
            customerEmail,
            ticketId,
            subject,
            priority
          );
          results.push(result);
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Notificações enviadas para ${successCount}/${admins.length} administradores`);

      return { 
        success: successCount > 0, 
        message: `Notificações enviadas para ${successCount} administradores` 
      };
    } catch (error) {
      console.error('❌ Erro ao notificar admins sobre ticket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dispara email de atualização de dados
   */
  static async triggerDataUpdateConfirmation(
    userEmail: string,
    userName: string,
    updatedFields: string[]
  ) {
    try {
      console.log('🔄 Enviando confirmação de atualização de dados...');
      
      const result = await EmailService.sendDataUpdateConfirmationEmail(
        userEmail,
        userName,
        updatedFields
      );

      if (result.success) {
        console.log('✅ Email de confirmação de atualização enviado com sucesso');
      }

      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar confirmação de atualização:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dispara email com código de verificação
   */
  static async triggerVerificationCode(
    userEmail: string,
    userName: string
  ) {
    try {
      console.log('🔄 Gerando e enviando código de verificação...');
      
      // Gerar código de 6 dígitos
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Salvar código no banco (você pode criar uma tabela para isso)
      // Por enquanto, apenas enviamos o email
      
      const result = await EmailService.sendVerificationCodeEmail(
        userEmail,
        userName,
        verificationCode
      );

      if (result.success) {
        console.log('✅ Código de verificação enviado com sucesso');
        return { ...result, verificationCode }; // Retorna o código para uso posterior
      }

      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar código de verificação:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitora faturas vencidas e envia notificações automaticamente
   */
  static async checkOverdueInvoices() {
    try {
      console.log('🔄 Verificando faturas vencidas...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar faturas vencidas
      const { data: overdueInvoices, error } = await supabase
        .from('invoices')
        .select('id, due_date')
        .eq('status', 'issued')
        .lt('due_date', today.toISOString());

      if (error) {
        console.error('Erro ao buscar faturas vencidas:', error);
        return { success: false, error: error.message };
      }

      console.log(`📊 Encontradas ${overdueInvoices?.length || 0} faturas vencidas`);

      const results = [];
      
      if (overdueInvoices && overdueInvoices.length > 0) {
        for (const invoice of overdueInvoices) {
          const result = await this.triggerOverdueInvoiceNotification(invoice.id);
          results.push(result);
          
          // Adicionar delay entre envios para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      return {
        success: true,
        message: `Processadas ${overdueInvoices?.length || 0} faturas, ${successCount} emails enviados`
      };
    } catch (error) {
      console.error('❌ Erro ao verificar faturas vencidas:', error);
      return { success: false, error: error.message };
    }
  }
}

export default EmailAutomationService;
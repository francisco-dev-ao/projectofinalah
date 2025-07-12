import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailTestConfig {
  smtp_host: string;
  smtp_port: number;
  auth: {
    user: string;
    pass: string;
  };
  secure: boolean | string;
  from_email: string;
  from_name: string;
}

export const testEmailConfiguration = async (testEmail: string) => {
  try {
    console.log('🔄 Iniciando teste de configuração de email para:', testEmail);
    
    // Get email configuration
    const { data, error } = await supabase
      .from('company_settings')
      .select('email_config')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data?.email_config) {
      console.error('❌ Configuração de email não encontrada:', error);
      toast.error('Configuração de email não encontrada');
      return { success: false, error: 'Email configuration not found' };
    }

    const config = data.email_config as EmailTestConfig;

    console.log('📋 Configuração de email carregada:', {
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.secure,
      user: config.auth.user,
      from: config.from_email
    });

    // Prepare test email content
    const testEmailContent = {
      to: testEmail,
      subject: 'Teste de Configuração SMTP - AngoHost',
      html: generateTestEmailHTML(),
      config: config
    };

    console.log('📧 Enviando email de teste via edge function...');
    
    // Send test email using Supabase edge function
    const { data: result, error: sendError } = await supabase.functions.invoke('send-test-email', {
      body: testEmailContent
    });

    console.log('📬 Resposta da edge function:', { result, error: sendError });

    if (sendError) {
      console.error('❌ Erro na edge function:', sendError);
      toast.error(`Erro ao enviar email: ${sendError.message}`);
      return { success: false, error: sendError.message };
    }

    if (!result || !result.success) {
      console.error('❌ Falha no envio do email:', result);
      const errorMessage = result?.error || 'Falha no envio do email';
      toast.error(`Erro: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    console.log('✅ Email enviado com sucesso!', result);
    toast.success(`Email de teste enviado para ${testEmail} via ${result.method || 'SMTP'}`);
    return { success: true, message: `Test email sent to ${testEmail}`, method: result.method };

  } catch (error) {
    console.error('❌ Erro crítico ao testar configuração de email:', error);
    toast.error('Erro crítico ao testar configuração de email');
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

const generateTestEmailHTML = (): string => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #0066cc;">
          <h2 style="margin: 0; color: #0066cc;">AngoHost - Teste de Email</h2>
        </div>
        
        <div style="padding: 20px;">
          <h3 style="color: #0066cc;">✅ Configuração SMTP Funcionando!</h3>
          
          <p>Parabéns! Sua configuração de SMTP está funcionando corretamente.</p>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;"><strong>Este é um email de teste enviado em:</strong></p>
            <p style="margin: 5px 0 0 0; color: #155724;">${new Date().toLocaleString('pt-AO')}</p>
          </div>
          
          <p>Agora você pode:</p>
          <ul>
            <li>Enviar faturas por email automaticamente</li>
            <li>Notificar clientes sobre novos pedidos</li>
            <li>Enviar confirmações de pagamento</li>
          </ul>
          
          <p>Se você recebeu este email, significa que o sistema está pronto para enviar emails para seus clientes.</p>
          
          <p>Atenciosamente,<br>Sistema AngoHost</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} AngoHost. Sistema de gestão integrado.</p>
        </div>
      </body>
    </html>
  `;
};
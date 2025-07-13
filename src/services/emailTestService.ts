import { toast } from 'sonner';
import { EmailService } from '@/services/emailService';

export const testEmailConfiguration = async (testEmail: string) => {
  try {
    console.log('🔄 Iniciando teste de configuração de email para:', testEmail);
    
    const result = await EmailService.sendTestEmail(testEmail);

    if (result.success) {
      console.log('✅ Email de teste enviado com sucesso!');
      toast.success(`Email de teste enviado para ${testEmail}`);
      return { success: true, message: `Test email sent to ${testEmail}` };
    } else {
      console.error('❌ Falha no envio do email de teste:', result.error);
      toast.error(`Erro: ${result.error}`);
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('❌ Erro crítico ao testar configuração de email:', error);
    toast.error('Erro crítico ao testar configuração de email');
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
import { sendAutomaticOrderEmail } from '@/services/order/emailService';

/**
 * Dispara automaticamente emails de confirmação de pedido
 * Pode ser usado em qualquer lugar onde um pedido é criado/processado
 */
export const triggerOrderEmail = async (
  orderId: string,
  customerEmail?: string,
  customerName?: string,
  options: {
    silent?: boolean; // Se true, não mostra logs de erro no console
    retry?: boolean;  // Se true, tenta reenviar em caso de falha
  } = {}
) => {
  const { silent = false, retry = true } = options;

  try {
    const result = await sendAutomaticOrderEmail(orderId, customerEmail, customerName);
    
    if (result.success) {
      if (!silent) {
        console.log(`✅ Email de confirmação enviado para pedido: ${orderId}`);
      }
      return { success: true };
    } else {
      if (!silent) {
        console.error(`❌ Falha ao enviar email para pedido ${orderId}:`, result.error);
      }
      
      // Retry logic if enabled
      if (retry) {
        if (!silent) {
          console.log(`🔄 Tentando reenviar email para pedido: ${orderId}`);
        }
        
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const retryResult = await sendAutomaticOrderEmail(orderId, customerEmail, customerName);
        if (retryResult.success) {
          if (!silent) {
            console.log(`✅ Email reenviado com sucesso para pedido: ${orderId}`);
          }
          return { success: true };
        } else {
          if (!silent) {
            console.error(`❌ Falha no reenvio do email para pedido ${orderId}:`, retryResult.error);
          }
          return { success: false, error: retryResult.error };
        }
      }
      
      return { success: false, error: result.error };
    }
  } catch (error) {
    if (!silent) {
      console.error(`❌ Erro crítico ao enviar email para pedido ${orderId}:`, error);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Hook up para monitorar mudanças de status de pedidos via Supabase Realtime
 * e disparar emails automaticamente
 */
export const setupOrderEmailTriggers = () => {
  // Esta função pode ser expandida para usar Supabase Realtime
  // Por agora, mantemos a funcionalidade básica
  console.log('📧 Sistema de emails automáticos inicializado');
};
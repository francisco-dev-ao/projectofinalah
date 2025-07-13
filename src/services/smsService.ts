/**
 * Serviço de SMS para AngoHost
 * Integração com API de SMS
 */

interface SMSRequest {
  to: string;
  message: string;
  from?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMSService {
  private static readonly QAS_SENDER_TOKEN = 'qasc286d208556410d8be7930979d';
  private static readonly PRD_SENDER_TOKEN = 'prdc821442f717b71ceab02b35df7';
  private static readonly API_TOKEN = 'b8a2bde6ee90fcdb7ee6495889';
  private static readonly BASE_URL = 'https://api.sms-service.com'; // URL da API do Postman
  private static readonly IS_PRODUCTION = process.env.NODE_ENV === 'production';

  private static getSenderToken(): string {
    return this.IS_PRODUCTION ? this.PRD_SENDER_TOKEN : this.QAS_SENDER_TOKEN;
  }

  /**
   * Envia SMS para um número
   */
  static async sendSMS(request: SMSRequest): Promise<SMSResponse> {
    try {
      console.log('📱 Enviando SMS para:', request.to);

      const response = await fetch(`${this.BASE_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-token': this.API_TOKEN,
          'sender-token': this.getSenderToken(),
        },
        body: JSON.stringify({
          to: request.to,
          message: request.message,
          from: request.from || 'AngoHost',
          origin: ''
        })
      });

      if (!response.ok) {
        throw new Error(`SMS API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ SMS enviado com sucesso!');

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ Erro ao enviar SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Envia código de verificação via SMS
   */
  static async sendVerificationCode(phone: string, code: string): Promise<SMSResponse> {
    const message = `AngoHost: Seu código de verificação é ${code}. Válido por 10 minutos. Não compartilhe este código.`;
    
    return this.sendSMS({
      to: phone,
      message
    });
  }

  /**
   * Envia notificação de pagamento confirmado
   */
  static async sendPaymentNotification(phone: string, orderId: string, amount: number): Promise<SMSResponse> {
    const message = `AngoHost: Pagamento confirmado! Pedido #${orderId.substring(0, 8)} - ${amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}. Obrigado!`;
    
    return this.sendSMS({
      to: phone,
      message
    });
  }

  /**
   * Envia lembrete de fatura vencida
   */
  static async sendOverdueReminder(phone: string, invoiceNumber: string): Promise<SMSResponse> {
    const message = `AngoHost: Fatura #${invoiceNumber} está vencida. Proceda ao pagamento para evitar suspensão dos serviços.`;
    
    return this.sendSMS({
      to: phone,
      message
    });
  }
}

export default SMSService;
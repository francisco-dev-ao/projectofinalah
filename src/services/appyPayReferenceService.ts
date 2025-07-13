import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendAutomaticOrderEmail } from '@/services/order/emailService';
import { triggerOrderEmail } from '@/utils/orderEmailTrigger';
import { sendPaymentReferenceEmail } from '@/services/paymentReferencePdfService';

export interface AppyPayReferenceRequest {
  orderId: string;
  amount: number;
  description?: string;
  validityDays?: number;
}

export interface AppyPayReferenceResponse {
  success: boolean;
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

// === Credenciais AppyPay ===
const clientId = '14590a63-158d-4eed-a108-47ffcd6122c4';
const clientSecret = 'U5W8Q~YFBrH8zktWmEIPDPsZGWskKWNCtTsyYbi4';

// === Criar cobrança via API AngoHost ===
async function criarCobranca(cartItems: any[], orderId: string) {
  const amount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const description = cartItems?.map(item => item.name).join(', ') || 'Serviços diversos';

  console.log('🔄 Chamando API AngoHost com:', { amount, description });

  const response = await fetch('https://api.angohost.ao/appypay/ref', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      description
    })
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Resposta da API AngoHost:', data);
  console.log('🔍 Estrutura completa da resposta:', JSON.stringify(data, null, 2));
  return data;
}

/**
 * Generate payment reference through AppyPay
 */
export const generatePaymentReference = async (
  request: AppyPayReferenceRequest
): Promise<AppyPayReferenceResponse> => {
  try {
    console.log('🛒 Iniciando cobrança AppyPay com carrinho:', request);
    
    // Simular cartItems a partir do request
    const cartItems = [{
      name: request.description || `Pedido ${request.orderId}`,
      price: request.amount,
      quantity: 1
    }];
    
    // === Executar cobrança ===
    const chargeData = await criarCobranca(cartItems, request.orderId);
    console.log('✅ Cobrança criada:', chargeData);

    // Calcular data de validade (2 dias)
    const validityDate = new Date(Date.now() + 2 * 86400000);

    // Armazenar no banco de dados local
    const { error: insertError } = await supabase
      .from("payment_references")
      .insert({
        order_id: request.orderId,
        reference: chargeData.reference || chargeData.merchantTransactionId,
        amount: request.amount,
        status: "pending",
        payment_method: "appypay_reference",
        entity: "11333",
        description: chargeData.description,
        validity_date: validityDate.toISOString()
      });

    if (insertError) {
      console.error('Error storing payment reference:', insertError);
      throw new Error('Falha ao registrar referência de pagamento');
    }

    // Salvar entidade e referência na fatura (tabela invoices)
    await supabase
      .from('invoices')
      .update({
        payment_entity: '11333',
        payment_reference: chargeData.reference || chargeData.merchantTransactionId
      })
      .eq('order_id', request.orderId);

    // Aguarda a referência estar realmente salva e associada ao pedido
    let invoiceData;
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from("invoices")
        .select(`
          *,
          orders (
            *,
            profiles:user_id (*),
            payment_references (*),
            order_items (*)
          )
        `)
        .eq("order_id", request.orderId)
        .single();
      if (data && data.orders && data.orders.payment_references && data.orders.payment_references.length > 0) {
        invoiceData = data;
        break;
      }
      await new Promise(res => setTimeout(res, 300)); // espera 300ms antes de tentar de novo
    }

    if (invoiceData) {
      // PDF functionality removed - print reference instead
      console.log('Reference payment completed - PDF generation disabled');
      // Users can now print reference using PrintReferenceButton
      // Atualizar a fatura com o link do PDF
      await supabase
        .from('invoices')
        .update({
          status: 'pending_payment',
          pdf_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pdf_url: null // PDF generation removed
        })
        .eq('id', invoiceData.id);
      // Enviar fatura por email ao cliente
      // Email será enviado automaticamente pelo hook useOrderEmail

    }

    // Atualizar status do pedido
    await supabase
      .from("orders")
      .update({
        status: "pending_payment",
        updated_at: new Date().toISOString()
      })
      .eq("id", request.orderId);

    // Enviar email automático com dados de pagamento (sem PDF)
    try {
      const response = await supabase.functions.invoke('send-payment-reference-email', {
        body: {
          to: invoiceData?.orders?.profiles?.email || 'email@example.com',
          customerName: invoiceData?.orders?.profiles?.name || 'Cliente',
          entity: '11333',
          reference: chargeData.reference || chargeData.merchantTransactionId,
          amount: request.amount.toString(),
          description: chargeData.description,
          validityDate: validityDate.toLocaleDateString('pt-AO'),
          instructions: [
            "Vá a um ATM ou Multicaixa Express",
            "Selecione 'Pagamentos' → 'Outros Serviços'",
            "Digite a Entidade: 11333",
            `Digite a Referência: ${chargeData.reference || chargeData.merchantTransactionId}`,
            `Confirme o valor: KZ ${request.amount.toLocaleString('pt-AO').replace(/,/g, '.')}`,
            "Confirme o pagamento"
          ],
          orderData: invoiceData?.orders
        }
      });

      if (response.error) {
        console.error('Erro ao enviar email:', response.error);
      } else {
        console.log('Email enviado com sucesso');
      }
    } catch (emailError) {
      console.error('Erro ao enviar email automático:', emailError);
    }

    // Também enviar email automático de confirmação do pedido
    triggerOrderEmail(request.orderId, undefined, undefined, { silent: false, retry: true });

    // Retornar resposta formatada
    return {
      success: true,
      entity: "11333",
      reference: chargeData.reference || chargeData.merchantTransactionId,
      amount: request.amount,
      description: chargeData.description,
      validity_date: validityDate.toISOString(),
      validity_days: 2,
      order_id: request.orderId,
      instructions: {
        pt: {
          title: "Como pagar por referência",
          steps: [
            "Vá a um ATM ou Multicaixa Express",
            "Selecione 'Pagamentos' → 'Outros Serviços'",
            "Digite a Entidade: 11333",
            `Digite a Referência: ${chargeData.reference || chargeData.merchantTransactionId}`,
            `Confirme o valor: KZ ${request.amount.toLocaleString('pt-AO').replace(/,/g, '.')}`,
            "Confirme o pagamento"
          ],
          note: `Esta referência é válida até ${validityDate.toLocaleDateString('pt-AO')}`
        }
      },
      payment_channels: [
        "ATM",
        "Internet Banking", 
        "Multicaixa Express",
        "Balcão Bancário"
      ]
    };
  } catch (error: any) {
    console.error('❌ Erro no AppyPay:', error.message);
    
    // Fallback: gerar referência local em caso de erro
    console.log('🔄 Fallback: gerando referência local...');
    return await generateLocalReference(request);
  }
};

/**
 * Função específica para criar cobrança diretamente com cartItems
 */
export const criarCobrancaComCarrinho = async (cartItems: any[], orderId: string) => {
  try {
    console.log('🛒 Processando carrinho:', cartItems);
    
    const chargeData = await criarCobranca(cartItems, orderId);
    
    console.log('✅ Cobrança criada com carrinho:', chargeData);
    console.log('🔍 Estrutura completa da resposta AppyPay:', JSON.stringify(chargeData, null, 2));
    
    // Extrair a referência correta da resposta da API AngoHost
    const paymentReference = chargeData?.responseStatus?.reference?.referenceNumber ||
                           chargeData?.reference?.referenceNumber ||
                           chargeData?.referenceNumber ||
                           chargeData?.reference ||
                           chargeData?.merchantTransactionId ||
                           chargeData?.id;
    
    console.log('🔍 Referência extraída:', paymentReference);
    
    return {
      success: true,
      data: chargeData,
      reference: paymentReference,
      amount: cartItems.reduce((total, item) => total + (item.price * item.quantity), 0),
      description: cartItems?.map(item => item.name).join(', ') || 'Serviços diversos'
    };
    
  } catch (error: any) {
    console.error('❌ Erro ao criar cobrança com carrinho:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Fallback: Generate local reference when AppyPay API is unavailable
 */
const generateLocalReference = async (
  request: AppyPayReferenceRequest
): Promise<AppyPayReferenceResponse> => {
  console.log('Generating fallback local reference:', request);
  
  // Gerar referência de 9 dígitos localmente
  const reference = Math.floor(100000000 + Math.random() * 900000000).toString();
  
  // Calcular data de validade
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (request.validityDays || 3));
  
  // Armazenar no banco de dados local
  const { error: insertError } = await supabase
    .from("payment_references")
    .insert({
      order_id: request.orderId,
      reference: reference,
      amount: parseFloat(request.amount.toString()),
      status: "pending",
      payment_method: "appypay_reference",
      entity: "11333",
      description: request.description || `Pagamento do pedido ${request.orderId}`,
      validity_date: validityDate.toISOString(),
      appypay_response: {
        referenceNumber: reference,
        amount: request.amount,
        currency: "AOA",
        status: "pending",
        fallback_mode: true,
        note: "Referência gerada localmente - verificar manualmente no AppyPay"
      }
    });

  if (insertError) {
    console.error('Error storing local reference:', insertError);
  }

  // Atualizar status do pedido
  await supabase
    .from("orders")
    .update({
      status: "pending_payment",
      updated_at: new Date().toISOString()
    })
      .eq("id", request.orderId);

    // Buscar dados da fatura para enviar email
    const { data: invoiceData } = await supabase
      .from("invoices")
      .select(`
        *,
        orders (
          *,
          profiles:user_id (*),
          payment_references (*),
          order_items (*)
        )
      `)
      .eq("order_id", request.orderId)
      .single();

    // Enviar email automático com dados de pagamento (modo fallback, sem PDF)
    if (invoiceData?.orders?.profiles?.email) {
      try {
        const response = await supabase.functions.invoke('send-payment-reference-email', {
          body: {
            to: invoiceData.orders.profiles.email,
            customerName: invoiceData.orders.profiles.name || 'Cliente',
            entity: '11333',
            reference: reference,
            amount: request.amount.toString(),
            description: request.description || `Pagamento do pedido ${request.orderId}`,
            validityDate: validityDate.toLocaleDateString('pt-AO'),
            instructions: [
              "Vá a um ATM ou Multicaixa Express",
              "Selecione 'Pagamentos' → 'Outros Serviços'",
              "Digite a Entidade: 11333",
              `Digite a Referência: ${reference}`,
              `Confirme o valor: KZ ${request.amount.toLocaleString('pt-AO').replace(/,/g, '.')}`,
              "Confirme o pagamento"
            ],
            orderData: invoiceData.orders
          }
        });

        if (response.error) {
          console.error('Erro ao enviar email (fallback):', response.error);
        } else {
          console.log('Email enviado com sucesso (fallback)');
        }
      } catch (emailError) {
        console.error('Erro ao enviar email automático (fallback):', emailError);
      }
    }

    // Também enviar email automático de confirmação do pedido (modo fallback)
    triggerOrderEmail(request.orderId, undefined, undefined, { silent: false, retry: true });

  // Automatically generate and print invoice PDF for local reference too
  try {
    console.log('🧾 Generating and printing invoice PDF automatically (local reference)...');
    
    // Get invoice for this order with complete data
    const { data: invoiceData } = await supabase
      .from("invoices")
      .select(`
        *,
        orders (
          *,
          profiles:user_id (*),
          payment_references (*),
          order_items (*)
        )
      `)
      .eq("order_id", request.orderId)
      .single();
    
    if (invoiceData) {
      // Import PDF generator dynamically
      // PDF functionality removed - using print reference instead
      console.log('Local reference generated - PDF generation disabled');
      
      // PDF functionality removed - print reference button available instead
      console.log('Local reference generated - Users can print reference via UI button');
    }
  } catch (error) {
    console.error('Error in automatic invoice generation and printing (local):', error);
  }

  // Retornar resposta formatada
  return {
    success: true,
    entity: "11333",
    reference: reference,
    amount: parseFloat(request.amount.toString()),
    description: request.description || `Pagamento do pedido ${request.orderId}`,
    validity_date: validityDate.toISOString(),
    validity_days: request.validityDays || 3,
    order_id: request.orderId,
    instructions: {
      pt: {
        title: "Como pagar por referência",
        steps: [
          "Vá a um ATM ou Multicaixa Express",
          "Selecione 'Pagamentos' → 'Outros Serviços'",
          "Digite a Entidade: 11333",
          `Digite a Referência: ${reference}`,
          `Confirme o valor: KZ ${request.amount.toLocaleString('pt-AO').replace(/,/g, '.')}`,
          "Confirme o pagamento"
        ],
        note: `Esta referência é válida até ${validityDate.toLocaleDateString('pt-AO')} - ⚠️ Modo de fallback: verificar manualmente no AppyPay`
      }
    },
    payment_channels: [
      "ATM",
      "Internet Banking", 
      "Multicaixa Express",
      "Balcão Bancário"
    ]
  };
};


/**
 * Get payment reference status
 */
export const getPaymentReferenceStatus = async (reference: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_references')
      .select(`
        *,
        orders (
          id,
          status,
          total_amount
        )
      `)
      .eq('reference', reference)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching payment reference status:', error);
    throw new Error('Erro ao buscar status da referência de pagamento');
  }
};

/**
 * Get all payment references for an order
 */
export const getOrderPaymentReferences = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_references')
      .select('*')
      .eq('order_id', orderId)
      .eq('payment_method', 'appypay_reference')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching order payment references:', error);
    return [];
  }
};

/**
 * Check if a payment reference is still valid
 */
export const isReferenceValid = (validityDate: string): boolean => {
  const now = new Date();
  const validity = new Date(validityDate);
  return validity > now;
};

/**
 * Calculate time remaining for a payment reference
 */
export const getTimeRemaining = (validityDate: string): string => {
  const now = new Date().getTime();
  const validityTime = new Date(validityDate).getTime();
  const difference = validityTime - now;

  if (difference <= 0) {
    return 'Expirado';
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} dias, ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Format amount for display
 */
export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Validate payment reference format
 */
export const validateReferenceFormat = (reference: string): boolean => {
  // AppyPay reference format: 9 dígitos
  const referenceRegex = /^\d{9}$/;
  return referenceRegex.test(reference);
};

/**
 * AppyPay Reference Service class
 */
export class AppyPayReferenceService {

  constructor() {
    // Modo produção apenas
  }

  async generateReference(request: AppyPayReferenceRequest): Promise<AppyPayReferenceResponse> {
    return generatePaymentReference(request);
  }

  async getReferenceStatus(reference: string) {
    return getPaymentReferenceStatus(reference);
  }

  async getOrderReferences(orderId: string) {
    return getOrderPaymentReferences(orderId);
  }

  validateReference(reference: string): boolean {
    return validateReferenceFormat(reference);
  }

  isValid(validityDate: string): boolean {
    return isReferenceValid(validityDate);
  }

  getTimeRemaining(validityDate: string): string {
    return getTimeRemaining(validityDate);
  }

  formatAmount(amount: number): string {
    return formatAmount(amount);
  }
}

// Default service instance - Produção apenas
export const appyPayReferenceService = new AppyPayReferenceService();
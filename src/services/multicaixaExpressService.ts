
import { supabase } from "@/integrations/supabase/client";

interface MulticaixaExpressConfig {
  frametoken: string;
  callback: string;
  success: string;
  error: string;
}

interface MulticaixaResponse {
  id?: string;
  message?: string;
  success?: boolean;
  error?: string;
}

interface PaymentDetails {
  orderId: string;
  amount: number;
  items: any[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

// Função para obter as configurações do Multicaixa Express
export const getMulticaixaExpressConfig = async (): Promise<MulticaixaExpressConfig | null> => {
  try {
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching Multicaixa Express config:", error);
      return null;
    }

    if (data && data.multicaixa_express_config) {
      const config = typeof data.multicaixa_express_config === 'string'
        ? JSON.parse(data.multicaixa_express_config)
        : data.multicaixa_express_config;
        
      return config as MulticaixaExpressConfig;
    }

    return null;
  } catch (error) {
    console.error("Error in getMulticaixaExpressConfig:", error);
    return null;
  }
};

// Função para gerar referência para o Multicaixa Express (10 dígitos)
const generateReference = (orderId: string): string => {
  // Pegar apenas os primeiros 5 caracteres do orderId (sem hífens)
  const orderPrefix = orderId.replace(/-/g, '').substring(0, 5);
  
  // Timestamp atual em milissegundos (últimos 5 dígitos)
  const timestamp = Date.now().toString().slice(-5);
  
  // Combinar para formar 10 dígitos
  return orderPrefix + timestamp;
};

// Função para iniciar o pagamento Multicaixa Express
export const initiateMulticaixaExpressPayment = async (
  paymentDetails: PaymentDetails
): Promise<MulticaixaResponse> => {
  try {
    const config = await getMulticaixaExpressConfig();
    
    if (!config) {
      return {
        success: false,
        error: "Erro ao obter configurações do Multicaixa Express"
      };
    }

    if (!paymentDetails.orderId) {
      console.error("Missing orderId in payment details", paymentDetails);
      return {
        success: false,
        error: "ID do pedido é obrigatório"
      };
    }

    if (!paymentDetails.amount || paymentDetails.amount <= 0) {
      console.error("Invalid amount in payment details", paymentDetails);
      return {
        success: false,
        error: "Valor do pagamento deve ser maior que zero"
      };
    }
    
    // Gerar referência de 10 dígitos para Multicaixa
    const reference = generateReference(paymentDetails.orderId);
    
    const params = {
      reference: reference,
      originalOrderId: paymentDetails.orderId, // Manter o ID original do pedido
      amount: paymentDetails.amount,
      token: config.frametoken,
      mobile: "PAYMENT",
      card: "DISABLED",
      qrCode: "PAYMENT",
      callbackUrl: config.callback,
      customerData: {
        name: paymentDetails.customerName || "",
        email: paymentDetails.customerEmail || "",
        phone: paymentDetails.customerPhone || ""
      },
      orderItems: paymentDetails.items || []
    };

    const { data, error } = await supabase.functions.invoke("multicaixa-payment", {
      body: params
    });

    if (error) {
      console.error("Error initiating Multicaixa Express payment:", error);
      return {
        success: false,
        error: error.message || "Erro ao iniciar pagamento"
      };
    }

    if (!data || !data.id) {
      console.error("Invalid response from multicaixa-payment function:", data);
      return {
        success: false,
        error: data?.error || "Resposta inválida do servidor de pagamento"
      };
    }

    return {
      success: true,
      id: data.id
    };
  } catch (error) {
    console.error("Error in initiateMulticaixaExpressPayment:", error);
    return {
      success: false,
      error: "Erro ao iniciar pagamento Multicaixa Express"
    };
  }
};

// Função para verificar o status do pagamento
export const checkMulticaixaPaymentStatus = async (orderId: string): Promise<boolean> => {
  try {
    if (!orderId) {
      console.error("No orderId provided to checkMulticaixaPaymentStatus");
      return false;
    }
    
    const { data, error } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      console.error("Error checking payment status:", error);
      return false;
    }

    return data?.status === "paid";
  } catch (error) {
    console.error("Error in checkMulticaixaPaymentStatus:", error);
    return false;
  }
};

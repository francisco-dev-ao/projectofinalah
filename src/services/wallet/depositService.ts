import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Invoice } from "@/types/invoice";
import { RpcReturnTypes } from "@/types/supabase";

interface DepositInvoiceData {
  userId: string;
  walletId: string;
  amount: number;
  paymentMethod: string;
}

/**
 * Creates an invoice for wallet deposit and returns the invoice details
 */
export const createDepositInvoice = async (data: DepositInvoiceData): Promise<{
  success: boolean;
  invoice?: Invoice;
  error?: any;
}> => {
  try {
    const { userId, amount, paymentMethod } = data;
    
    // Get user details for the invoice
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error("Error fetching user data:", userError);
      return { success: false, error: "Não foi possível obter os dados do usuário" };
    }

    // Generate invoice number
    const invoiceNumber = `WD-${new Date().getTime().toString().substring(5)}`;
    
    // Set due date to 48 hours from now
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 48);
    
    // Gerar token
    const token = uuidv4();

    // Cria a invoice SEM order_id (pois wallet_deposit não tem order)
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        user_id: userId,
        due_date: dueDate.toISOString(),
        // NÃO incluir order_id aqui!
        status: 'issued',
        invoice_type: 'wallet_deposit',
        total_amount: amount,
        currency: 'AOA',
        payment_method: paymentMethod,
        token: token,
        metadata: { amount, description: 'Depósito na carteira' }
      })
      .select()
      .single();

    if (invoiceError || !invoiceData) {
      console.error("Error creating invoice:", invoiceError);
      return { success: false, error: "Não foi possível criar a fatura" };
    }
    
    // Create a proper Invoice object from the data
    const invoice: Invoice = {
      id: invoiceData.id,
      invoice_number: invoiceData.invoice_number,
      order_id: invoiceData.order_id, // pode ser null
      status: invoiceData.status,
      created_at: invoiceData.created_at,
      updated_at: invoiceData.updated_at,
      due_date: invoiceData.due_date,
      pdf_url: invoiceData.pdf_url || '',
      company_details: invoiceData.company_details || '',
      payment_instructions: invoiceData.payment_instructions || '',
      is_public: invoiceData.is_public || false,
      public_token: invoiceData.public_token || '',
      share_token: invoiceData.share_token || token,
    };
    
    return { 
      success: true, 
      invoice
    };
  } catch (error) {
    console.error("Error in createDepositInvoice:", error);
    return { success: false, error: "Ocorreu um erro ao processar o depósito" };
  }
};

/**
 * Process a wallet deposit based on payment method
 */
export const processWalletDeposit = async (
  userId: string,
  amount: number,
  paymentMethod: string
): Promise<{
  success: boolean;
  invoiceId?: string;
  paymentUrl?: string;
  error?: any;
}> => {
  try {
    // Get wallet for this user using direct query instead of RPC
    const { data: wallets, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId);
      
    if (walletError) {
      console.error("Error getting wallet:", walletError);
      return { success: false, error: "Erro ao verificar carteira" };
    }
    
    let walletId: string;
    
    // Create wallet if it doesn't exist
    if (!wallets || wallets.length === 0) {
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          balance: 0,
          currency: 'AOA'
        })
        .select()
        .single();
      
      if (createError || !newWallet) {
        console.error("Error creating wallet:", createError);
        return { success: false, error: "Não foi possível criar carteira" };
      }
      
      walletId = newWallet.id;
    } else {
      walletId = wallets[0].id;
    }
    
    // Create deposit invoice
    const invoiceResult = await createDepositInvoice({
      userId,
      walletId,
      amount,
      paymentMethod
    });

    if (!invoiceResult.success || !invoiceResult.invoice) {
      return { success: false, error: invoiceResult.error || "Falha ao criar a fatura" };
    }

    // Process payment - Apenas método online_payment é suportado
    if (paymentMethod === 'online_payment') {
      // Use sistema de pagamento integrado
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference: `WALLET-${invoiceResult.invoice.id.substring(0, 8)}`,
          amount: amount,
          invoiceId: invoiceResult.invoice.id
        })
      });

      const paymentData = await response.json();
      
      if (!paymentData.success) {
        return {
          success: false,
          invoiceId: invoiceResult.invoice.id,
          error: paymentData.error || "Erro ao processar pagamento online"
        };
      }

      return {
        success: true,
        invoiceId: invoiceResult.invoice.id,
        paymentUrl: paymentData.paymentUrl || null
      };
    }

    // Se o método de pagamento não for online_payment, retorna erro
    return {
      success: false,
      error: "Método de pagamento não suportado. Por favor, use Pagamento Online."
    };
  } catch (error) {
    console.error("Error in processWalletDeposit:", error);
    return { success: false, error: "Ocorreu um erro ao processar o depósito" };
  }
};

/**
 * Update wallet balance after successful payment
 */
export const creditWalletFromInvoice = async (invoiceId: string): Promise<boolean> => {
  try {
    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
      
    if (invoiceError || !invoice) {
      console.error("Error getting invoice:", invoiceError);
      return false;
    }
    
    // Check if invoice is paid and has metadata
    if (invoice.status !== 'paid' || !invoice.metadata || !invoice.metadata.amount) {
      return false;
    }
    
    const amount = Number(invoice.metadata.amount);
    
    // Get user wallet
    const { data: wallets, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', invoice.user_id);
      
    if (walletError) {
      console.error("Error getting wallet:", walletError);
      return false;
    }
    
    let wallet;
    
    // Create wallet if it doesn't exist
    if (!wallets || wallets.length === 0) {
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: invoice.user_id,
          balance: amount,
          currency: 'AOA'
        })
        .select()
        .single();
        
      if (createError || !newWallet) {
        console.error("Error creating wallet:", createError);
        return false;
      }
      
      wallet = newWallet;
    } else {
      wallet = wallets[0];
      
      // Update existing wallet balance
      const newBalance = Number(wallet.balance) + amount;
      
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);
        
      if (updateError) {
        console.error("Error updating wallet:", updateError);
        return false;
      }
    }
    
    // Create transaction record
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        amount: amount,
        balance_after: Number(wallet.balance) + amount,
        type: 'credit',
        category: 'deposit',
        description: `Depósito - Fatura #${invoice.invoice_number}`,
        reference_id: invoiceId,
        reference_type: 'invoice',
        status: 'completed'
      });
      
    if (txError) {
      console.error("Error creating transaction:", txError);
      // We still return true as the balance was updated
    }
    
    return true;
  } catch (error) {
    console.error("Error in creditWalletFromInvoice:", error);
    return false;
  }
};


import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { creditWalletFromInvoice } from "./depositService";

/**
 * Check for pending invoices and attempt to update their status
 */
export const checkPendingInvoices = async (): Promise<boolean> => {
  try {
    // Get user ID from session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    if (!userId) {
      console.error("No authenticated user found");
      return false;
    }

    // Use direct query instead of RPC function for better type safety
    const { data: unpaidInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'issued')
      .eq('invoice_type', 'wallet_deposit');
      
    if (fetchError) {
      console.error("Error fetching invoices:", fetchError);
      toast.error("Erro ao verificar depósitos pendentes");
      return false;
    }
    
    // If no invoices were found
    if (!unpaidInvoices || unpaidInvoices.length === 0) {
      toast.info("Nenhum pagamento pendente encontrado");
      return true;
    }
    
    let processedCount = 0;
    
    // Process each invoice to mark as paid and credit the wallet
    for (const invoice of unpaidInvoices) {
      // Update invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          metadata: {
            manually_processed: true,
            process_date: new Date().toISOString()
          }
        })
        .eq('id', invoice.id);
        
      if (!updateError) {
        await creditWalletFromInvoice(invoice.id);
        processedCount++;
      }
    }
    
    toast.success(`${processedCount} ${processedCount === 1 ? 'pagamento' : 'pagamentos'} processado com sucesso`);
    return true;
  } catch (error) {
    console.error("Error in checkPendingInvoices:", error);
    toast.error("Erro ao verificar pagamentos pendentes");
    return false;
  }
};

/**
 * Process a webhook notification for wallet payment
 */
export const processWalletPaymentWebhook = async (
  paymentReference: string | { id: string } | null,
  status: string,
  transactionId: string
): Promise<boolean> => {
  try {
    // Log incoming webhook data
    console.log("Processing payment webhook:", { paymentReference, status, transactionId });
    
    if (!paymentReference) {
      console.error("Missing payment reference in webhook");
      return false;
    }
    
    // Handle nested reference format from Multicaixa
    const refId = typeof paymentReference === 'object' && paymentReference !== null
      ? paymentReference.id 
      : paymentReference;
    
    console.log("Extracted payment reference ID:", refId);
    
    // Try multiple approaches to find the payment reference
    // 1. Try exact match on reference field
    let paymentRef;
    
    const { data: exactRef } = await supabase
      .from('payment_references')
      .select('*')
      .eq('reference', refId)
      .maybeSingle();
      
    if (exactRef) {
      paymentRef = exactRef;
    } else {
      // 2. Try to find reference containing the payment reference
      const { data: containsRefs } = await supabase
        .from('payment_references')
        .select('*')
        .ilike('reference', `%${refId}%`)
        .limit(1);
        
      if (containsRefs && containsRefs.length > 0) {
        paymentRef = containsRefs[0];
        console.log("Found payment reference using LIKE query:", paymentRef);
      } else {
        // 3. Try to find by invoice reference
        const { data: invoice } = await supabase
          .from('invoices')
          .select('*')
          .or(`reference.eq.${refId},order_id.eq.${refId}`)
          .maybeSingle();
          
        if (invoice) {
          console.log("Found invoice with matching reference:", invoice);
          
          // Create payment reference record if doesn't exist
          const { data: newRef } = await supabase
            .from('payment_references')
            .insert({
              order_id: invoice.order_id,
              invoice_id: invoice.id,
              reference: refId,
              token: transactionId || `tx-${Date.now()}`,
              amount: invoice.total_amount,
              status: 'pending'
            })
            .select()
            .single();
            
          if (newRef) {
            paymentRef = newRef;
          }
        }
      }
    }
    
    if (!paymentRef) {
      console.error("Payment reference not found:", refId);
      
      // Log the failed webhook for manual investigation
      await supabase
        .from('webhook_logs')
        .insert({
          webhook_type: 'payment',
          status: 'reference_not_found',
          reference: refId,
          transaction_id: transactionId,
          data: { paymentReference, status, transactionId },
          created_at: new Date().toISOString()
        });
        
      return false;
    }
    
    // Update payment reference status
    const { error: updateRefError } = await supabase
      .from('payment_references')
      .update({ 
        status: status === "ACCEPTED" ? "paid" : "failed",
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRef.id);
      
    if (updateRefError) {
      console.error("Error updating payment reference:", updateRefError);
    }
    
    // If payment was successful
    if (status === "ACCEPTED") {
      // Update invoice status
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          metadata: {
            payment_date: new Date().toISOString(),
            transaction_id: transactionId,
            payment_reference: refId,
            payment_method: "multicaixa"
          }
        })
        .eq('id', paymentRef.invoice_id);
        
      if (invoiceError) {
        console.error("Error updating invoice:", invoiceError);
        return false;
      }
      
      // Log successful webhook processing
      await supabase
        .from('webhook_logs')
        .insert({
          webhook_type: 'payment',
          status: 'processed',
          reference: refId,
          transaction_id: transactionId,
          invoice_id: paymentRef.invoice_id,
          data: { paymentReference, status, transactionId },
          created_at: new Date().toISOString()
        });
      
      // Credit wallet
      return await creditWalletFromInvoice(paymentRef.invoice_id);
    } else {
      // Log failed payment
      await supabase
        .from('webhook_logs')
        .insert({
          webhook_type: 'payment',
          status: 'payment_failed',
          reference: refId,
          transaction_id: transactionId,
          invoice_id: paymentRef.invoice_id,
          data: { paymentReference, status, transactionId },
          created_at: new Date().toISOString()
        });
    }
    
    return false;
  } catch (error) {
    console.error("Error in processWalletPaymentWebhook:", error);
    return false;
  }
};

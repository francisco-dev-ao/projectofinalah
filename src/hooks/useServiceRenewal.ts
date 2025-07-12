
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { triggerOrderEmail } from "@/utils/orderEmailTrigger";

// Service renewal options type
export interface RenewalOptions {
  serviceId: string;
  userId: string;
  upgradeOptions?: {
    newPlan: string;
  };
}

const useServiceRenewal = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Renew a service for a specified period
   */
  const renewService = async (serviceId: string, userId: string, period = "1year") => {
    setIsProcessing(true);
    try {
      // 1. Create renewal order
      const orderId = uuidv4();
      
      // Determine pricing based on period
      const getPriceForPeriod = () => {
        switch(period) {
          case "1month": return 1500;
          case "3months": return 4000;
          case "6months": return 7500;
          case "1year": return 14000;
          case "2years": return 26000;
          default: return 14000; // Default to 1 year
        }
      };
      
      const getDurationForPeriod = () => {
        switch(period) {
          case "1month": return 1;
          case "3months": return 3;
          case "6months": return 6;
          case "1year": return 12;
          case "2years": return 24;
          default: return 12; // Default to 1 year
        }
      };
      
      const price = getPriceForPeriod();
      const duration = getDurationForPeriod();
      
      // Create order
      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        user_id: userId,
        status: "pending",
        total_amount: price,
        payment_status: "pending",
      });
      
      if (orderError) {
        console.error("Error creating renewal order:", orderError);
        return { success: false, error: orderError };
      }
      
      // Create order item
      const { error: itemError } = await supabase.from("order_items").insert({
        name: "Renovação de Serviço",
        order_id: orderId,
        unit_price: price,
        quantity: 1,
        duration: duration,
        duration_unit: "month",
      });
      
      if (itemError) {
        console.error("Error creating order item:", itemError);
        return { success: false, error: itemError };
      }
      
      // Create invoice
      const invoiceNumber = `INV-${Date.now()}`;
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          order_id: orderId,
          status: "issued",
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();
      
      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
        return { success: false, error: invoiceError };
      }
      
      // Send automatic order confirmation email
      triggerOrderEmail(orderId, undefined, undefined, { silent: false, retry: true });

      toast.success("Renovação solicitada com sucesso!");
      return { 
        success: true, 
        order_id: orderId,
        invoice_id: invoice.id
      };
    } catch (error) {
      console.error("Error in service renewal:", error);
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    renewService,
    isProcessing
  };
};

export default useServiceRenewal;

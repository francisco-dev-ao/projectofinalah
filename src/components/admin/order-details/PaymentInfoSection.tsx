import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatPrice } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type PaymentInfoSectionProps = {
  payments: any[];
  orderStatus: string;
  orderId: string;
  onShowPaymentDialog: () => void;
  onShowDirectPaymentDialog: () => void;
  formatDate: (date: string) => string;
};

const PaymentInfoSection = ({
  payments = [],
  orderStatus,
  orderId,
  onShowPaymentDialog,
  onShowDirectPaymentDialog,
  formatDate
}: PaymentInfoSectionProps) => {
  const [bankTransferInstructions, setBankTransferInstructions] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch instructions if there are payments pending and payment method is transfer/bank_transfer
    if (payments.some(p => p.status === "awaiting" && (p.method === "transfer" || p.method === "bank_transfer"))) {
      fetchBankTransferInstructions();
    }
  }, [payments]);

  const fetchBankTransferInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('bank_transfer_instructions')
        .single();
      
      if (error) {
        console.error("Error fetching bank transfer instructions:", error);
      } else if (data) {
        setBankTransferInstructions(data.bank_transfer_instructions || null);
      }
    } catch (error) {
      console.error("Failed to fetch bank transfer instructions:", error);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Informações de Pagamento</h3>
      {payments && payments.length > 0 ? (
        <div className="space-y-4">
          {payments.map((payment: any) => (
            <div key={payment.id} className="bg-muted p-3 rounded">
              <div className="flex justify-between">
                <span className="font-medium">Método:</span>
                <span>
                  {payment.method === "multicaixa" && "Multicaixa Express"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <OrderStatusBadge status={payment.status} type="payment" />
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Valor:</span>
                <span>{formatPrice(payment.amount_paid)}</span>
              </div>
              {payment.payment_date && (
                <div className="flex justify-between">
                  <span className="font-medium">Data:</span>
                  <span>{formatDate(payment.payment_date)}</span>
                </div>
              )}
              {payment.transaction_id && (
                <div className="flex justify-between">
                  <span className="font-medium">ID da Transação:</span>
                  <span>{payment.transaction_id}</span>
                </div>
              )}
              {payment.notes && (
                <div className="mt-2">
                  <span className="font-medium">Observações:</span>
                  <p className="text-sm mt-1">{payment.notes}</p>
                </div>
              )}

              {(payment.status === "awaiting" && (payment.method === "bank_transfer" || payment.method === "transfer")) && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  {/* Instruções para Pagamento removidas conforme solicitado */}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          <p className="text-muted-foreground">Nenhum pagamento registrado.</p>
          
          {orderStatus !== "paid" && orderStatus !== "cancelled" && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onShowPaymentDialog}
              >
                Registrar Pagamento + Fatura
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={onShowDirectPaymentDialog}
              >
                Pagamento Direto (Sem Fatura)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentInfoSection;

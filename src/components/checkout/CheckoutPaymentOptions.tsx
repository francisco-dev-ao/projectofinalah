import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Building2, Smartphone, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export type PaymentMethodType = "appypay_reference" | "cash_payment";

interface PaymentOptionsProps {
  paymentMethod: PaymentMethodType;
  onPaymentMethodChange: (value: PaymentMethodType) => void;
}

export const CheckoutPaymentOptions = ({ paymentMethod, onPaymentMethodChange }: PaymentOptionsProps) => {
  const [bankTransferInstructions, setBankTransferInstructions] = useState<string>("");
  const [multicaixaInstructions, setMulticaixaInstructions] = useState<string>("");
  
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        // Use the limit(1) to ensure we only get one row, regardless of how many exist
        const { data, error } = await supabase
          .from('company_settings')
          .select('bank_transfer_instructions, multicaixa_instructions')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching company settings:", error);
          return;
        }
        
        if (data) {
          setBankTransferInstructions(data.bank_transfer_instructions || "");
          setMulticaixaInstructions(data.multicaixa_instructions || "");
        }
      } catch (error) {
        console.error("Error fetching company settings:", error);
      }
    };

    fetchCompanySettings();
  }, []);

  return (
    <RadioGroup value={paymentMethod} onValueChange={(value) => onPaymentMethodChange(value as PaymentMethodType)}>
      <div className="space-y-4">
        {/* AppyPay Reference Payment - Único método ativo */}
        <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-all duration-300 hover:shadow-lg hover:border-green-300 cursor-pointer group">
          <h3 className="font-bold text-green-800 mb-3 flex items-center group-hover:text-green-900 transition-colors">
            <CreditCard className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            Pagamento por Referência Multicaixa
          </h3>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="appypay_reference" id="option-appypay-reference" />
            <Label htmlFor="option-appypay-reference" className="flex items-center cursor-pointer group-hover:text-green-900 transition-colors">
              <img 
                src="/lovable-uploads/f8d6177e-8235-4942-af13-8da5c89452a9.png" 
                alt="Multicaixa" 
                className="mr-2 h-6 w-6 object-contain group-hover:scale-110 transition-transform duration-300"
              />
              Entidade: 11333 - Referência gerada em tempo real
            </Label>
          </div>
        </div>
        
        {paymentMethod === "appypay_reference" && (
          <Card className="mt-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all duration-300 hover:shadow-md animate-fade-in">
            <CardContent className="p-4 text-sm">
              <h3 className="font-bold mb-3 text-green-700 flex items-center">
                <img 
                  src="/lovable-uploads/f8d6177e-8235-4942-af13-8da5c89452a9.png" 
                  alt="Multicaixa" 
                  className="mr-2 h-5 w-5 object-contain"
                />
                Pagamento via ATM, Internet Banking, Multicaixa Express ou Balcão Bancário
              </h3>
              
              <div className="bg-green-100 p-3 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-green-800">Entidade:</span>
                  <span className="font-mono text-lg font-bold text-green-900">11333</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-semibold text-green-800">Referência:</span>
                  <span className="text-green-700 italic">Será exibida após confirmação</span>
                </div>
              </div>
              
              <ol className="list-decimal ml-5 space-y-2 text-green-800">
                <li>Dirija-se a um ATM, Internet Banking, Multicaixa Express ou Balcão Bancário</li>
                <li>Selecione "Pagamentos" e depois "Outros Serviços"</li>
                <li>Insira a Entidade: <strong>11333</strong></li>
                <li>Insira a Referência que será gerada automaticamente</li>
                <li>Confirme o valor e finalize o pagamento</li>
              </ol>
              
              <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-700">
                <strong>Vantagens:</strong> Pagamento seguro e instantâneo. A referência é gerada em tempo real e válida por 48 horas.
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Pagamento em Dinheiro - DESATIVADO */}
        {false && (
          <>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:shadow-lg hover:border-gray-300 cursor-pointer group">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center group-hover:text-gray-900 transition-colors">
                <Building2 className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                Pagamento em Dinheiro (Teste)
              </h3>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash_payment" id="option-cash-payment" />
                <Label htmlFor="option-cash-payment" className="flex items-center cursor-pointer group-hover:text-gray-900 transition-colors">
                  💵 Pagamento em Dinheiro - Modo Teste
                </Label>
              </div>
            </div>
            
            {paymentMethod === "cash_payment" && (
              <Card className="mt-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:shadow-md animate-fade-in">
                <CardContent className="p-4 text-sm">
                  <h3 className="font-bold mb-3 text-gray-700 flex items-center">
                    💵 Instruções para Pagamento em Dinheiro (Teste)
                  </h3>
                  
                  <div className="bg-blue-100 p-3 rounded-lg mb-3">
                    <p className="text-blue-800 font-semibold">Entre em contato para dados bancários</p>
                  </div>
                  
                  <ol className="list-decimal ml-5 space-y-2 text-gray-800">
                    <li>Entre em contato com o suporte para obter dados bancários</li>
                    <li>Realize a transferência conforme instruído</li>
                    <li>Guarde o comprovativo de pagamento</li>
                    <li>Envie o comprovativo para confirmação</li>
                  </ol>
                  
                  <div className="mt-3 p-2 bg-orange-100 rounded text-xs text-orange-700">
                    <strong>⚠️ Modo Teste:</strong> Este método está ativo apenas para testes administrativos.
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </RadioGroup>
  );
};

// Default export
export default CheckoutPaymentOptions;

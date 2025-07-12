
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { processWalletDeposit } from "@/services/wallet/depositService";
import { useAuth } from "@/contexts/AuthContext";

interface AddFundsDialogProps {
  open: boolean;
  onClose: () => void;
  onDeposit: (amount: number, paymentMethod: string) => Promise<boolean>;
}

const AddFundsDialog = ({ open, onClose, onDeposit }: AddFundsDialogProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("online_payment");
  const [isLoading, setIsLoading] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);

  const MIN_AMOUNT = 10000;
  const MAX_AMOUNT = 2000000;

  const handleAmountChange = (value: string) => {
    const numericValue = parseFloat(value.replace(/[^0-9]/g, ""));
    setAmount(isNaN(numericValue) ? 0 : numericValue);
    
    // Validate amount
    if (numericValue < MIN_AMOUNT) {
      setAmountError(`O valor mínimo é ${MIN_AMOUNT} Kz`);
    } else if (numericValue > MAX_AMOUNT) {
      setAmountError(`O valor máximo é ${MAX_AMOUNT} Kz`);
    } else {
      setAmountError(null);
    }
  };

  const handleSubmit = async () => {
    if (!amount || amount < MIN_AMOUNT) {
      toast.error(`O valor mínimo é ${MIN_AMOUNT} Kz`);
      return;
    }
    
    if (amount > MAX_AMOUNT) {
      toast.error(`O valor máximo é ${MAX_AMOUNT} Kz`);
      return;
    }
    
    // Removida verificação de método de pagamento já que agora é fixo

    if (!user?.id) {
      toast.error("Você precisa estar autenticado para adicionar fundos");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Process the deposit through our new service
      const result = await processWalletDeposit(
        user.id,
        amount,
        paymentMethod
      );
      
      if (result.success) {
        setCurrentInvoiceId(result.invoiceId || null);
        
        if (paymentMethod === 'online_payment') {
          if (result.paymentUrl) {
            // Redirecionar para o sistema de pagamento online
            window.open(result.paymentUrl, '_blank');
            toast.success("Você será redirecionado para o sistema de pagamento.");
          } else {
            toast.success("Fatura gerada com sucesso. Verifique a seção de faturas para efetuar o pagamento.");
          }
          resetForm();
          onClose();
        }
      } else {
        toast.error(result.error || "Erro ao processar o depósito");
      }
    } catch (error) {
      console.error("Error processing deposit:", error);
      toast.error("Ocorreu um erro ao processar o depósito");
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setAmount(0);
    setPaymentMethod("online_payment");
    setAmountError(null);
    setCurrentInvoiceId(null);
  };

  const handleCloseEmisPayment = () => {
    if (currentInvoiceId) {
      toast.success("O seu pagamento está a ser processado. Assim que for confirmado, o saldo será adicionado à sua carteira.");
    }
    
    resetForm();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
          onClose();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Saldo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor (Kz)</Label>
              <Input
                id="amount"
                type="number"
                value={amount || ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Digite o valor"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                className={amountError ? "border-red-500" : ""}
              />
              {amountError && (
                <p className="text-sm text-red-500">{amountError}</p>
              )}
              <p className="text-xs text-gray-500">
                Valor mínimo: {MIN_AMOUNT} Kz | Valor máximo: {MAX_AMOUNT} Kz
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-method">Método de Pagamento</Label>
              <div className="p-3 border rounded-md bg-gray-50">
                <p className="font-medium text-gray-900">Pagamento Online</p>
                <p className="text-xs text-gray-500 mt-1">
                  Você será redirecionado para o sistema de pagamento após confirmar.
                </p>
              </div>
              {/* Campo Select foi removido, pois só existe um método de pagamento */}
              <input type="hidden" name="payment-method" value="online_payment" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !!amountError || !amount}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Adicionar Saldo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddFundsDialog;

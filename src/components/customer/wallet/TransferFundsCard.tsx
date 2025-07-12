
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface TransferFundsCardProps {
  onTransfer: (recipientEmail: string, amount: number, notes?: string) => Promise<boolean>;
  currentBalance: number;
}

const TransferFundsCard = ({ onTransfer, currentBalance }: TransferFundsCardProps) => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAmountChange = (value: string) => {
    const numericValue = parseFloat(value.replace(/[^0-9]/g, ""));
    setAmount(isNaN(numericValue) ? 0 : numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientEmail) {
      toast.error("Informe o e-mail do destinatário");
      return;
    }
    
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido para transferência");
      return;
    }
    
    if (amount > currentBalance) {
      toast.error("Saldo insuficiente para esta transferência");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await onTransfer(recipientEmail, amount, notes);
      if (success) {
        resetForm();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setRecipientEmail("");
    setAmount(0);
    setNotes("");
  };

  return (
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border-none overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 to-transparent z-0"></div>
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
          <Send className="mr-2 h-5 w-5 text-indigo-600" />
          Transferência Interna
        </CardTitle>
        <CardDescription>
          Transfira valores para outros usuários do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient-email">E-mail do Destinatário</Label>
            <Input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Valor (Kz)</Label>
            <Input
              id="transfer-amount"
              type="number"
              value={amount || ""}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Digite o valor"
              min={1}
              max={currentBalance}
              required
            />
            <p className="text-xs text-gray-500">
              Saldo disponível: KZ {new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(currentBalance)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="transfer-notes">Descrição (opcional)</Label>
            <Textarea
              id="transfer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione uma descrição para esta transferência"
              rows={3}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={isLoading || !recipientEmail || !amount || amount <= 0 || amount > currentBalance}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Transferir
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransferFundsCard;

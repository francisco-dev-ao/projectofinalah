
import { useState, useEffect } from "react";
import { Wallet } from "@/types/wallet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddFundsDialog from "./AddFundsDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkPendingInvoices } from "@/services/wallet/paymentWebhookHandler";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { RpcReturnTypes } from "@/types/supabase";

interface WalletBalanceProps {
  wallet: Wallet | null;
  isLoading: boolean;
  onDeposit: (amount: number, paymentMethod: string) => Promise<boolean>;
}

interface PendingDeposit {
  amount: number;
  count: number;
}

const WalletBalance = ({ wallet, isLoading, onDeposit }: WalletBalanceProps) => {
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit | null>(null);
  const [checkingPending, setCheckingPending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingDeposits();
  }, [wallet]);

  const fetchPendingDeposits = async () => {
    if (!wallet || !user?.id) return;

    try {
      // Use direct query instead of RPC function
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'issued')
        .eq('invoice_type', 'wallet_deposit');
      
      if (error) {
        console.error("Error fetching pending deposits:", error);
        return;
      }
      
      if (data && data.length > 0) {
        // Calculate total amount from metadata
        let totalAmount = 0;
        data.forEach(invoice => {
          if (invoice.metadata && invoice.metadata.amount) {
            totalAmount += Number(invoice.metadata.amount);
          }
        });
        
        setPendingDeposits({
          amount: totalAmount,
          count: data.length
        });
      } else {
        setPendingDeposits(null);
      }
    } catch (error) {
      console.error("Error in fetchPendingDeposits:", error);
    }
  };

  const handleCheckPendingDeposits = async () => {
    if (!pendingDeposits) return;
    
    setCheckingPending(true);
    try {
      await checkPendingInvoices();
      toast.info("Verificação de depósitos pendentes concluída");
      fetchPendingDeposits();
      // Refresh wallet data via parent component
      onDeposit(0, "refresh");
    } catch (error) {
      console.error("Error checking pending deposits:", error);
      toast.error("Erro ao verificar depósitos pendentes");
    } finally {
      setCheckingPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Saldo da Carteira</h3>
        <Button 
          onClick={() => setShowAddFundsDialog(true)}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> 
          Adicionar Fundos
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Banknote className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Saldo Atual</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-36" />
                ) : (
                  <p className="text-3xl font-bold">
                    KZ {new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(wallet?.balance || 0)}
                  </p>
                )}
              </div>
            </div>
            
            {pendingDeposits && (
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800">
                  {pendingDeposits.count} {pendingDeposits.count === 1 ? 'depósito' : 'depósitos'} pendente
                </p>
                <p className="text-xs text-yellow-700">
                  Total: KZ {new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(pendingDeposits.amount)}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full text-xs h-8 border-yellow-300 bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                  onClick={handleCheckPendingDeposits}
                  disabled={checkingPending}
                >
                  {checkingPending ? "Verificando..." : "Verificar Pagamentos"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddFundsDialog
        open={showAddFundsDialog}
        onClose={() => setShowAddFundsDialog(false)}
        onDeposit={onDeposit}
      />
    </div>
  );
};

export default WalletBalance;


import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BellRing, Loader2 } from "lucide-react";
import { WalletNotificationPreferences } from "@/types/wallet";
import { toast } from "sonner";

interface NotificationSettingsProps {
  preferences: WalletNotificationPreferences | null;
  isLoading: boolean;
  onUpdate: (preferences: Partial<WalletNotificationPreferences>) => Promise<boolean>;
}

const NotificationSettings = ({ preferences, isLoading, onUpdate }: NotificationSettingsProps) => {
  const [notifyOnTransaction, setNotifyOnTransaction] = useState(true);
  const [notifyOnLowBalance, setNotifyOnLowBalance] = useState(true);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(5000);
  const [notifyViaEmail, setNotifyViaEmail] = useState(true);
  const [notifyViaSms, setNotifyViaSms] = useState(false);
  const [notifyViaPush, setNotifyViaPush] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state from preferences
  useEffect(() => {
    if (preferences) {
      setNotifyOnTransaction(preferences.notify_on_transaction);
      setNotifyOnLowBalance(preferences.notify_on_low_balance);
      setLowBalanceThreshold(preferences.low_balance_threshold);
      setNotifyViaEmail(preferences.notify_via_email);
      setNotifyViaSms(preferences.notify_via_sms);
      setNotifyViaPush(preferences.notify_via_push);
      setWeeklySummary(preferences.weekly_summary);
      setMonthlySummary(preferences.monthly_summary);
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const updatedPreferences: Partial<WalletNotificationPreferences> = {
        notify_on_transaction: notifyOnTransaction,
        notify_on_low_balance: notifyOnLowBalance,
        low_balance_threshold: lowBalanceThreshold,
        notify_via_email: notifyViaEmail,
        notify_via_sms: notifyViaSms,
        notify_via_push: notifyViaPush,
        weekly_summary: weeklySummary,
        monthly_summary: monthlySummary
      };
      
      await onUpdate(updatedPreferences);
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border-none overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent z-0"></div>
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
          <BellRing className="mr-2 h-5 w-5 text-amber-600" />
          Configurações de Notificação
        </CardTitle>
        <CardDescription>
          Personalize como você recebe alertas sobre sua carteira
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Tipos de Notificação</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-transactions">Notificar sobre transações</Label>
              <p className="text-xs text-gray-500">
                Receba alertas para cada movimento na sua carteira
              </p>
            </div>
            <Switch
              id="notify-transactions"
              checked={notifyOnTransaction}
              onCheckedChange={setNotifyOnTransaction}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-low-balance">Alertas de saldo baixo</Label>
              <p className="text-xs text-gray-500">
                Seja notificado quando seu saldo estiver abaixo do limite definido
              </p>
            </div>
            <Switch
              id="notify-low-balance"
              checked={notifyOnLowBalance}
              onCheckedChange={setNotifyOnLowBalance}
            />
          </div>
          
          {notifyOnLowBalance && (
            <div className="pl-6 border-l-2 border-amber-200">
              <Label htmlFor="low-balance-threshold">Limite de saldo baixo (Kz)</Label>
              <Input
                id="low-balance-threshold"
                type="number"
                value={lowBalanceThreshold}
                onChange={(e) => setLowBalanceThreshold(Number(e.target.value))}
                className="mt-1"
                min={0}
              />
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Canais de Notificação</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-email">E-mail</Label>
            <Switch
              id="notify-email"
              checked={notifyViaEmail}
              onCheckedChange={setNotifyViaEmail}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-sms">SMS</Label>
            <Switch
              id="notify-sms"
              checked={notifyViaSms}
              onCheckedChange={setNotifyViaSms}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-push">Notificações Push</Label>
            <Switch
              id="notify-push"
              checked={notifyViaPush}
              onCheckedChange={setNotifyViaPush}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Resumos Periódicos</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-summary">Resumo Semanal</Label>
            <Switch
              id="weekly-summary"
              checked={weeklySummary}
              onCheckedChange={setWeeklySummary}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="monthly-summary">Resumo Mensal</Label>
            <Switch
              id="monthly-summary"
              checked={monthlySummary}
              onCheckedChange={setMonthlySummary}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="relative z-10">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationSettings;

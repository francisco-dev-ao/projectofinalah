
import { useEffect, useState } from "react";
import CustomerLayout from "@/components/customer/CustomerLayout";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import WalletBalance from "@/components/customer/wallet/WalletBalance";
import TransactionsList from "@/components/customer/wallet/TransactionsList";
import TransferFundsCard from "@/components/customer/wallet/TransferFundsCard";
import NotificationSettings from "@/components/customer/wallet/NotificationSettings";
import { Banknote, History, Send, BellRing, Loader2 } from "lucide-react";
import { Wallet } from "@/types/wallet";

const CustomerWallet = () => {
  const { profile } = useAuth();
  const { 
    wallet, 
    transactions, 
    totalTransactions,
    notificationPreferences,
    isLoading, 
    isTransactionsLoading,
    currentPage,
    deposit,
    transfer,
    updateNotifications,
    setPage,
    applyFilters,
    loadWalletData
  } = useWallet();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    document.title = "Minha Carteira | AngoHost";
  }, []);

  if (isLoading && !wallet) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">Carregando sua carteira...</h2>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const handleRefresh = () => {
    loadWalletData();
  };

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Minha Carteira</h1>
            <p className="text-gray-600 mt-1">
              Gerencie seu saldo, transações e configurações
            </p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4 md:mt-0" 
            onClick={handleRefresh}
          >
            Atualizar
          </Button>
        </div>

        <Tabs 
          defaultValue="overview" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="inline sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
              <span className="inline sm:hidden">Histórico</span>
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Transferência</span>
              <span className="inline sm:hidden">Transferir</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
              <span className="inline sm:hidden">Alertas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <WalletBalance 
              wallet={wallet} 
              isLoading={isLoading} 
              onDeposit={(amount, paymentMethod) => deposit({ amount, payment_method: paymentMethod })}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Últimas Transações</h3>
                {isTransactionsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-6 text-center border rounded-lg bg-gray-50">
                    <p className="text-gray-600">Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                      <li key={transaction.id} className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between">
                          <span className="font-medium truncate max-w-[70%]">
                            {transaction.description}
                          </span>
                          <span className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'credit' ? '+' : '-'} KZ {new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(transaction.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString('pt-AO')}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status === 'completed' 
                              ? 'Concluído' 
                              : transaction.status === 'pending'
                                ? 'Pendente'
                                : 'Cancelado'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("history")}
                  >
                    Ver histórico completo
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Informações da Conta</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <div className="p-4">
                      <p className="text-sm text-gray-500">Cliente</p>
                      <p className="font-medium">{profile?.name || "Usuário"}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-500">ID da Carteira</p>
                      <p className="font-medium truncate">{wallet?.id.substring(0, 8) || "-"}...</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-500">Data de Criação</p>
                      <p className="font-medium">
                        {wallet?.created_at 
                          ? new Date(wallet.created_at).toLocaleDateString('pt-AO')
                          : "-"}
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-500">Moeda</p>
                      <p className="font-medium">{wallet?.currency || "Kz"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Métodos de Pagamento</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 border rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Banknote className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Multicaixa Express</p>
                        <p className="text-sm text-gray-500">Pagamento instantâneo</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 border rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Send className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Transferência Bancária</p>
                        <p className="text-sm text-gray-500">2-3 dias úteis para processar</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <TransactionsList 
              transactions={transactions}
              isLoading={isTransactionsLoading}
              totalCount={totalTransactions}
              currentPage={currentPage}
              onPageChange={setPage}
              onFilterChange={applyFilters}
            />
          </TabsContent>

          <TabsContent value="transfer">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-3">
                <TransferFundsCard 
                  onTransfer={(recipientEmail, amount, notes) => transfer({ recipient_email: recipientEmail, amount, notes })}
                  currentBalance={wallet?.balance || 0}
                />
              </div>
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg p-6 shadow-md border-none">
                  <h3 className="text-lg font-semibold mb-4">Informações</h3>
                  <ul className="space-y-4 text-sm">
                    <li className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-amber-700 text-xs">1</span>
                      </div>
                      <span>As transferências são processadas imediatamente.</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-amber-700 text-xs">2</span>
                      </div>
                      <span>O destinatário deve estar registrado no sistema.</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-amber-700 text-xs">3</span>
                      </div>
                      <span>Você precisa ter saldo suficiente na sua carteira.</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-amber-700 text-xs">4</span>
                      </div>
                      <span>Será enviada uma notificação após a transferência.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-3">
                <NotificationSettings 
                  preferences={notificationPreferences}
                  isLoading={isLoading} 
                  onUpdate={updateNotifications}
                />
              </div>
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg p-6 shadow-md border-none">
                  <h3 className="text-lg font-semibold mb-4">Sobre as Notificações</h3>
                  <div className="space-y-6 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Notificações de Transação</h4>
                      <p className="text-gray-600">Receba alertas instantâneos sempre que houver uma movimentação na sua carteira.</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Alertas de Saldo Baixo</h4>
                      <p className="text-gray-600">Seja avisado quando seu saldo estiver abaixo do valor definido por você.</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Resumos Periódicos</h4>
                      <p className="text-gray-600">Acompanhe o histórico de sua carteira com relatórios semanais e mensais automatizados.</p>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        Nota: As notificações por SMS estão disponíveis apenas para números de telefone verificados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  );
};

export default CustomerWallet;

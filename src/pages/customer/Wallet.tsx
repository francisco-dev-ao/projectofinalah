import React, { useState } from 'react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { useWallet } from '@/hooks/useWallet';
import WalletBalance from '@/components/customer/wallet/WalletBalance';
import TransactionsList from '@/components/customer/wallet/TransactionsList';
import TransferFundsCard from '@/components/customer/wallet/TransferFundsCard';
import NotificationSettings from '@/components/customer/wallet/NotificationSettings';
import AddFundsDialog from '@/components/customer/wallet/AddFundsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ArrowDownUp, Bell, Wallet } from 'lucide-react';

const WalletPage: React.FC = () => {
  const { 
    wallet, 
    transactions, 
    totalTransactions, 
    notificationPreferences,
    isLoading, 
    isTransactionsLoading,
    loadWalletData, 
    refreshTransactions, 
    deposit,
    transfer,
    updateNotifications,
    currentPage,
    setPage,
    filters,
    applyFilters
  } = useWallet();

  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);

  const handleDepositSubmit = async (data: any) => {
    try {
      const success = await deposit(data);
      if (success) {
        setShowAddFundsDialog(false);
      }
      return success;
    } catch (error) {
      console.error('Error processing deposit:', error);
      return false;
    }
  };

  const handleTransferSubmit = async (recipientEmail: string, amount: number, notes?: string) => {
    try {
      const success = await transfer({ recipient_email: recipientEmail, amount, notes });
      return success;
    } catch (error) {
      console.error('Error processing transfer:', error);
      return false;
    }
  };

  const handleDepositFunds = async (amount: number, paymentMethod: string) => {
    try {
      const success = await deposit({ amount, payment_method: paymentMethod });
      return success;
    } catch (error) {
      console.error('Error processing deposit:', error);
      return false;
    }
  };

  const handleNotificationUpdate = async (preferences: any) => {
    try {
      const success = await updateNotifications(preferences);
      return success;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleFilterChange = (newFilters: any) => {
    applyFilters(newFilters);
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Carteira Digital</h1>
          <Button onClick={() => setShowAddFundsDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Fundos
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <WalletBalance 
            wallet={wallet} 
            isLoading={isLoading} 
            onDeposit={handleDepositFunds}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowDownUp className="h-5 w-5" />
                <span>Transações Recentes</span>
              </CardTitle>
              <CardDescription>
                As últimas 5 transações na sua carteira
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsList 
                transactions={transactions.slice(0, 5)}
                isLoading={isTransactionsLoading}
                totalCount={totalTransactions}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onFilterChange={handleFilterChange}
              />
              <div className="mt-4">
                <Button variant="outline" onClick={() => document.getElementById('transactions-tab')?.click()}>
                  Ver Todas as Transações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="transactions" id="transactions-tab">
              Transações
            </TabsTrigger>
            <TabsTrigger value="transfer">
              Transferência
            </TabsTrigger>
            <TabsTrigger value="notifications">
              Notificações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>
                  Visualize todas as transações da sua carteira
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionsList 
                  transactions={transactions}
                  isLoading={isTransactionsLoading}
                  totalCount={totalTransactions}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  onFilterChange={handleFilterChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfer" className="space-y-4 mt-6">
            <TransferFundsCard 
              onTransfer={handleTransferSubmit} 
              currentBalance={wallet?.balance || 0}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <NotificationSettings 
              preferences={notificationPreferences}
              isLoading={isLoading}
              onUpdate={handleNotificationUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AddFundsDialog
        open={showAddFundsDialog}
        onClose={() => setShowAddFundsDialog(false)}
        onDeposit={handleDepositFunds}
      />
    </CustomerLayout>
  );
};

export default WalletPage;

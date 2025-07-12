
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserWallet,
  getWalletTransactions,
  depositToWallet,
  transferFunds,
  getWalletNotificationPreferences,
  updateWalletNotificationPreferences
} from '@/services/walletService';
import { 
  Wallet,
  WalletTransaction,
  WalletNotificationPreferences,
  TransactionFilters,
  WalletDepositFormData,
  WalletTransferFormData
} from '@/types/wallet';

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [notificationPreferences, setNotificationPreferences] = useState<WalletNotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<TransactionFilters>({});

  // Load wallet data when user changes
  useEffect(() => {
    if (user?.id) {
      loadWalletData();
    } else {
      setWallet(null);
      setTransactions([]);
      setNotificationPreferences(null);
    }
  }, [user?.id]);

  // Load wallet data
  const loadWalletData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const wallet = await getUserWallet(user.id);
      setWallet(wallet);
      
      if (wallet) {
        await loadTransactions(wallet.id);
      }
      
      const preferences = await getWalletNotificationPreferences(user.id);
      setNotificationPreferences(preferences);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load transactions with pagination and filters
  const loadTransactions = useCallback(async (
    walletId: string,
    page = currentPage,
    pageSize = 10,
    transactionFilters = filters
  ) => {
    setIsTransactionsLoading(true);
    try {
      const result = await getWalletTransactions(walletId, transactionFilters, page, pageSize);
      setTransactions(result.transactions);
      setTotalTransactions(result.count);
      setCurrentPage(page);
      setFilters(transactionFilters);
    } finally {
      setIsTransactionsLoading(false);
    }
  }, [currentPage, filters]);

  // Reload transactions with current filters
  const refreshTransactions = useCallback(() => {
    if (wallet?.id) {
      loadTransactions(wallet.id, currentPage);
    }
  }, [wallet?.id, currentPage, loadTransactions]);

  // Deposit funds
  const deposit = useCallback(async (formData: WalletDepositFormData) => {
    if (!wallet) return false;
    
    const success = await depositToWallet(
      wallet.id,
      formData.amount,
      formData.payment_method
    );
    
    if (success) {
      await loadWalletData();
    }
    
    return success;
  }, [wallet, loadWalletData]);

  // Transfer funds
  const transfer = useCallback(async (formData: WalletTransferFormData) => {
    if (!wallet) return false;
    
    const success = await transferFunds(
      wallet.id,
      formData.recipient_email,
      formData.amount,
      formData.notes
    );
    
    if (success) {
      await loadWalletData();
    }
    
    return success;
  }, [wallet, loadWalletData]);

  // Update notification preferences
  const updateNotifications = useCallback(async (preferences: Partial<WalletNotificationPreferences>) => {
    if (!user?.id) return false;
    
    const success = await updateWalletNotificationPreferences(user.id, preferences);
    
    if (success) {
      const updatedPreferences = await getWalletNotificationPreferences(user.id);
      setNotificationPreferences(updatedPreferences);
    }
    
    return success;
  }, [user?.id]);

  // Change page
  const setPage = useCallback((page: number) => {
    if (wallet?.id) {
      loadTransactions(wallet.id, page);
    }
  }, [wallet?.id, loadTransactions]);

  // Apply filters
  const applyFilters = useCallback((newFilters: TransactionFilters) => {
    if (wallet?.id) {
      loadTransactions(wallet.id, 1, 10, newFilters);
    }
  }, [wallet?.id, loadTransactions]);

  return {
    wallet,
    transactions,
    totalTransactions,
    notificationPreferences,
    isLoading,
    isTransactionsLoading,
    currentPage,
    filters,
    loadWalletData,
    refreshTransactions,
    deposit,
    transfer,
    updateNotifications,
    setPage,
    applyFilters
  };
};

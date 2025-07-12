
// Re-export all functions from the different modules
// This maintains the same public API as before

// Core wallet operations
export { 
  getUserWallet,
  depositToWallet,
  transferFunds,
  adminAdjustWalletBalance 
} from './walletOperations';

// Transaction history
export { getWalletTransactions } from './transactionHistory';

// Notification preferences
export { 
  getWalletNotificationPreferences,
  updateWalletNotificationPreferences 
} from './notificationPreferences';

// Types
export type {
  Wallet,
  WalletTransaction,
  WalletTransfer,
  WalletNotificationPreferences,
  WalletDepositFormData,
  WalletTransferFormData,
  TransactionFilters,
  WalletTransactionType,
  WalletTransactionCategory,
  WalletTransactionStatus
} from '@/types/wallet';

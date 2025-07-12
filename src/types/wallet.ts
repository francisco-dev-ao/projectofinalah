
export type WalletTransactionType = 'credit' | 'debit';

export type WalletTransactionCategory = 
  | 'deposit' 
  | 'withdrawal' 
  | 'transfer_in' 
  | 'transfer_out' 
  | 'payment' 
  | 'refund' 
  | 'admin_adjustment';

export type WalletTransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  balance_after: number;
  type: WalletTransactionType;
  category: WalletTransactionCategory;
  description: string;
  reference_id?: string;
  reference_type?: string;
  status: WalletTransactionStatus;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface WalletTransfer {
  id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  status: WalletTransactionStatus;
  created_at: string;
  completed_at?: string;
  notes?: string;
}

export interface WalletNotificationPreferences {
  id: string;
  user_id: string;
  notify_on_transaction: boolean;
  notify_on_low_balance: boolean;
  low_balance_threshold: number;
  notify_via_email: boolean;
  notify_via_sms: boolean;
  notify_via_push: boolean;
  weekly_summary: boolean;
  monthly_summary: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletDepositFormData {
  amount: number;
  payment_method: string;
}

export interface WalletTransferFormData {
  recipient_email: string;
  amount: number;
  notes?: string;
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  type?: WalletTransactionType;
  category?: WalletTransactionCategory;
  status?: WalletTransactionStatus;
}

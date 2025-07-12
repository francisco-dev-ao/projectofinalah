// Supabase custom types

export type RpcFunction = 
  | "generate_new_invoice_token" 
  | "generate_stable_uuid" 
  | "get_current_user_role" 
  | "is_admin" 
  | "is_support" 
  | "setup_invoice_bucket_policies"
  | "get_user_wallet"
  | "create_user_wallet"
  | "get_wallet_transactions"
  | "deposit_to_wallet"
  | "transfer_between_wallets"
  | "get_pending_wallet_deposits"
  | "check_pending_wallet_deposits"
  | "process_wallet_payment_webhook"
  | "credit_wallet_from_invoice"
  | "create_wallet_deposit_invoice"
  | "get_or_create_user_wallet";

export interface SupabaseRpcResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface ServiceStatus {
  status: 'active' | 'suspended' | 'cancelled';
}

// Add wallet tables for TypeScript to recognize them
export interface SupabaseTables {
  user_wallets: {
    id: string;
    user_id: string;
    balance: number;
    currency: string;
    created_at: string;
    updated_at: string;
  };
  wallet_transactions: {
    id: string;
    wallet_id: string;
    amount: number;
    balance_after: number;
    type: string;
    category: string;
    description: string;
    reference_id?: string;
    reference_type?: string;
    status: string;
    created_at: string;
  };
}
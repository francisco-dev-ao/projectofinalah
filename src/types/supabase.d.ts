
// Used to handle the RPC function types
export type RpcFunction = 
  | "generate_new_invoice_token" 
  | "generate_stable_uuid" 
  | "get_current_user_role" 
  | "is_admin" 
  | "is_support" 
  | "setup_invoice_bucket_policies"
  | "get_pending_wallet_deposits"
  | "check_pending_wallet_deposits"
  | "process_wallet_payment_webhook"
  | "create_wallet_deposit_invoice"
  | "get_or_create_user_wallet"
  | "credit_wallet_from_invoice";

// Define return types for the wallet-related RPC functions
export interface RpcReturnTypes {
  get_pending_wallet_deposits: {
    count: number;
    total_amount: number;
    deposits: Array<{
      id: string;
      amount: number;
      created_at: string;
    }>;
  };
  check_pending_wallet_deposits: {
    processed: number;
    count: number;
    invoices: Array<{
      id: string;
      invoice_number: string;
      amount: number;
    }>;
  };
  process_wallet_payment_webhook: {
    success: boolean;
    invoice_id?: string;
    error?: string;
  };
  create_wallet_deposit_invoice: {
    invoice_id: string;
    invoice_number: string;
    error?: string;
  };
  get_or_create_user_wallet: {
    id: string;
    user_id: string;
    balance: number;
    currency: string;
    created_at: string;
    updated_at: string;
  };
  credit_wallet_from_invoice: {
    success: boolean;
    wallet_id?: string;
    amount?: number;
    error?: string;
  };
}

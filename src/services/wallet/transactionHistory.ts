
import { TransactionFilters, WalletTransaction } from "@/types/wallet";
import { toast } from "sonner";
import { mockTransactions } from './walletOperations';

/**
 * Get wallet transaction history for a wallet
 */
export const getWalletTransactions = async (
  walletId: string,
  filters: TransactionFilters = {},
  page = 1,
  pageSize = 10
): Promise<{ transactions: WalletTransaction[]; count: number }> => {
  try {
    let transactions = mockTransactions[walletId] || [];
    
    // Apply filters
    if (filters.type) {
      transactions = transactions.filter(t => t.type === filters.type);
    }
    
    if (filters.category) {
      transactions = transactions.filter(t => t.category === filters.category);
    }
    
    if (filters.status) {
      transactions = transactions.filter(t => t.status === filters.status);
    }
    
    if (filters.startDate) {
      transactions = transactions.filter(t => new Date(t.created_at) >= filters.startDate);
    }
    
    if (filters.endDate) {
      transactions = transactions.filter(t => new Date(t.created_at) <= filters.endDate);
    }
    
    // Calculate total count before pagination
    const count = transactions.length;
    
    // Apply pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    transactions = transactions.slice(start, end);

    return {
      transactions,
      count
    };
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    toast.error('Erro ao carregar histórico de transações');
    return { transactions: [], count: 0 };
  }
};

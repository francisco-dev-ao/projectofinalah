
import { Wallet, WalletTransaction } from "@/types/wallet";
import { toast } from "sonner";

// Mock wallet data
const mockWallets: Record<string, Wallet> = {};
const mockTransactions: Record<string, WalletTransaction[]> = {};

/**
 * Get the wallet for a user, creating one if it doesn't exist
 */
export const getUserWallet = async (userId: string): Promise<Wallet | null> => {
  try {
    // Check if wallet exists in our mock data
    if (!mockWallets[userId]) {
      // Create a new wallet
      mockWallets[userId] = {
        id: `wallet-${userId}`,
        user_id: userId,
        balance: 0,
        currency: 'AOA',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockTransactions[`wallet-${userId}`] = [];
    }

    return mockWallets[userId];
  } catch (error) {
    console.error('Error getting user wallet:', error);
    toast.error('Erro ao obter informações da carteira');
    return null;
  }
};

/**
 * Add funds to wallet (deposit)
 */
export const depositToWallet = async (
  walletId: string,
  amount: number,
  paymentMethod: string,
  reference?: string
): Promise<boolean> => {
  try {
    // Validate amount
    if (amount < 10000) {
      toast.error('O valor mínimo para depósito é 10.000 Kz');
      return false;
    }

    if (amount > 2000000) {
      toast.error('O valor máximo para depósito é 2.000.000 Kz');
      return false;
    }

    const wallet = mockWallets[walletId];
    if (!wallet) {
      toast.error('Carteira não encontrada');
      return false;
    }
    
    // Update wallet balance
    const newBalance = (wallet.balance || 0) + amount;
    wallet.balance = newBalance;
    wallet.updated_at = new Date().toISOString();
    
    // Create transaction record
    const transaction: WalletTransaction = {
      id: `tx-${Date.now()}`,
      wallet_id: walletId,
      amount: amount,
      balance_after: newBalance,
      type: 'credit',
      category: 'deposit',
      description: `Depósito via ${paymentMethod}`,
      reference_id: reference || null,
      reference_type: paymentMethod,
      status: 'completed',
      created_at: new Date().toISOString(),
      metadata: { payment_method: paymentMethod }
    };
    
    if (!mockTransactions[walletId]) {
      mockTransactions[walletId] = [];
    }
    
    mockTransactions[walletId].push(transaction);
    
    toast.success('Depósito realizado com sucesso');
    return true;
  } catch (error) {
    console.error('Error depositing to wallet:', error);
    toast.error('Erro ao realizar depósito');
    return false;
  }
};

/**
 * Transfer funds between wallets
 */
export const transferFunds = async (
  fromWalletId: string,
  toUserEmail: string,
  amount: number,
  notes?: string
): Promise<boolean> => {
  try {
    // Mock recipient user id based on email
    const recipientUserId = `user-${toUserEmail.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // Get wallets
    const senderWallet = mockWallets[fromWalletId];
    
    if (!senderWallet) {
      toast.error('Carteira de origem não encontrada');
      return false;
    }
    
    // Auto-create recipient wallet if it doesn't exist
    if (!mockWallets[recipientUserId]) {
      mockWallets[recipientUserId] = {
        id: `wallet-${recipientUserId}`,
        user_id: recipientUserId,
        balance: 0,
        currency: 'AOA',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockTransactions[`wallet-${recipientUserId}`] = [];
    }
    
    const recipientWallet = mockWallets[recipientUserId];
    
    // Check sufficient balance
    if ((senderWallet?.balance || 0) < amount) {
      toast.error('Saldo insuficiente para realizar esta transferência');
      return false;
    }
    
    // Update balances
    senderWallet.balance -= amount;
    recipientWallet.balance += amount;
    
    // Create transfer record
    const transferId = `transfer-${Date.now()}`;
    
    // Create transaction records for both wallets
    const senderTransaction: WalletTransaction = {
      id: `tx-sender-${Date.now()}`,
      wallet_id: fromWalletId,
      amount: amount,
      balance_after: senderWallet.balance,
      type: 'debit',
      category: 'transfer_out',
      description: `Transferência para ${toUserEmail}`,
      reference_id: transferId,
      reference_type: 'transfer',
      status: 'completed',
      created_at: new Date().toISOString(),
      metadata: { recipient_email: toUserEmail, notes: notes || null }
    };
    
    const recipientTransaction: WalletTransaction = {
      id: `tx-recipient-${Date.now()}`,
      wallet_id: recipientWallet.id,
      amount: amount,
      balance_after: recipientWallet.balance,
      type: 'credit',
      category: 'transfer_in',
      description: `Transferência recebida`,
      reference_id: transferId,
      reference_type: 'transfer',
      status: 'completed',
      created_at: new Date().toISOString(),
      metadata: { sender_email: `Usuário ID: ${senderWallet.user_id}`, notes: notes || null }
    };
    
    if (!mockTransactions[fromWalletId]) {
      mockTransactions[fromWalletId] = [];
    }
    
    if (!mockTransactions[recipientWallet.id]) {
      mockTransactions[recipientWallet.id] = [];
    }
    
    mockTransactions[fromWalletId].push(senderTransaction);
    mockTransactions[recipientWallet.id].push(recipientTransaction);

    toast.success('Transferência realizada com sucesso');
    return true;
  } catch (error) {
    console.error('Error transferring funds:', error);
    toast.error('Erro ao realizar transferência');
    return false;
  }
};

/**
 * For admin use: Update wallet balance
 */
export const adminAdjustWalletBalance = async (
  walletId: string,
  amount: number,
  isCredit: boolean,
  reason: string
): Promise<boolean> => {
  try {
    const wallet = mockWallets[walletId];
    
    if (!wallet) {
      toast.error('Carteira não encontrada');
      return false;
    }

    const adjustmentAmount = isCredit ? amount : -amount;
    const newBalance = (wallet.balance || 0) + adjustmentAmount;
    
    // Update wallet balance
    wallet.balance = newBalance;
    wallet.updated_at = new Date().toISOString();
    
    // Create transaction record
    const transaction: WalletTransaction = {
      id: `tx-admin-${Date.now()}`,
      wallet_id: walletId,
      amount: Math.abs(amount),
      balance_after: newBalance,
      type: isCredit ? 'credit' : 'debit',
      category: 'admin_adjustment',
      description: reason || 'Ajuste administrativo',
      reference_id: null,
      reference_type: 'admin',
      status: 'completed',
      created_at: new Date().toISOString(),
      metadata: { adjusted_by: 'admin', reason }
    };
    
    if (!mockTransactions[walletId]) {
      mockTransactions[walletId] = [];
    }
    
    mockTransactions[walletId].push(transaction);

    toast.success('Saldo ajustado com sucesso');
    return true;
  } catch (error) {
    console.error('Error adjusting wallet balance:', error);
    toast.error('Erro ao ajustar saldo da carteira');
    return false;
  }
};

// Export mockTransactions for use by other wallet modules
export { mockTransactions };

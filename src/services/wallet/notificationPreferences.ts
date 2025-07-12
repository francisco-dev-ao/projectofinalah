
import { WalletNotificationPreferences } from "@/types/wallet";
import { toast } from "sonner";

// Mock preferences data
const mockPreferences: Record<string, WalletNotificationPreferences> = {};

/**
 * Get wallet notification preferences
 */
export const getWalletNotificationPreferences = async (userId: string): Promise<WalletNotificationPreferences | null> => {
  try {
    // If preferences don't exist, create default ones
    if (!mockPreferences[userId]) {
      const defaultSettings: WalletNotificationPreferences = {
        id: userId,
        user_id: userId,
        notify_on_transaction: true,
        notify_on_low_balance: true,
        low_balance_threshold: 5000,
        notify_via_email: true,
        notify_via_sms: false,
        notify_via_push: true,
        weekly_summary: true,
        monthly_summary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockPreferences[userId] = defaultSettings;
    }
    
    return mockPreferences[userId];
  } catch (error) {
    console.error('Error getting wallet notification preferences:', error);
    toast.error('Erro ao obter preferências de notificação');
    return null;
  }
};

/**
 * Update wallet notification preferences
 */
export const updateWalletNotificationPreferences = async (
  userId: string, 
  preferences: Partial<WalletNotificationPreferences>
): Promise<boolean> => {
  try {
    // Get current or create new
    if (!mockPreferences[userId]) {
      await getWalletNotificationPreferences(userId);
    }
    
    // Update preferences
    mockPreferences[userId] = {
      ...mockPreferences[userId],
      ...preferences,
      updated_at: new Date().toISOString()
    };
    
    toast.success('Preferências de notificação atualizadas');
    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    toast.error('Erro ao atualizar preferências de notificação');
    return false;
  }
};

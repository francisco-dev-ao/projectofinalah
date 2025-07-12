import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SessionTimeoutOptions = {
  /**
   * Time in minutes after which the user will be logged out if inactive
   * Default: 60 minutes (1 hour)
   */
  timeoutMinutes?: number;
  
  /**
   * Whether to show a warning toast before logout
   * Default: true
   */
  showWarning?: boolean;
  
  /**
   * Time in minutes before timeout to show warning
   * Default: 5 minutes
   */
  warningMinutes?: number;
  
  /**
   * Callback to run after logout
   */
  onLogout?: () => void;
};

/**
 * Hook to handle automatic session timeout due to inactivity
 */
export function useSessionTimeout(options?: SessionTimeoutOptions) {
  const timeoutMinutes = options?.timeoutMinutes || 60; // 1 hour default
  const showWarning = options?.showWarning ?? true;
  const warningMinutes = options?.warningMinutes || 5;
  const onLogout = options?.onLogout;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  
  const resetTimers = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    // Set warning timer (if enabled)
    if (showWarning) {
      const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
      warningRef.current = setTimeout(() => {
        toast.warning(
          `A sua sessão vai expirar em ${warningMinutes} minutos por inatividade. Mova o mouse ou clique para continuar.`,
          {
            duration: 10000, // 10 seconds
            id: 'session-warning', // Use ID to prevent duplicate toasts
          }
        );
      }, warningTime);
    }
    
    // Set logout timer
    const logoutTime = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(async () => {
      // Logout the user
      await supabase.auth.signOut();
      
      // Show message
      toast.error('A sua sessão expirou devido a inatividade. Por favor, faça login novamente.', {
        duration: 5000,
        id: 'session-expired', // Use ID to prevent duplicate toasts
      });
      
      // Run custom callback if provided
      if (onLogout) onLogout();
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }, logoutTime);
  };
  
  useEffect(() => {
    // Initialize timers
    resetTimers();
    
    // Activity events to reset the timer
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'click', 'focus'
    ];
    
    // Function to handle user activity
    const handleActivity = () => {
      resetTimers();
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity);
    });
    
    // Cleanup function
    return () => {
      // Clear timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      
      // Remove event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [timeoutMinutes, warningMinutes, showWarning, onLogout]);
}

export default useSessionTimeout;

import { toast, ToastT, ExternalToast } from 'sonner';

/**
 * Enhanced toast utility that ensures unique IDs for toast messages
 * to prevent duplicated notifications
 */

/**
 * Shows a success toast with a unique ID
 * @param message The message to show
 * @param options Additional toast options
 */
export function showSuccess(message: string, options?: ExternalToast): string | number {
  const id = options?.id || `success-${Date.now()}`;
  return toast.success(message, { 
    ...options, 
    id
  });
}

/**
 * Shows an error toast with a unique ID
 * @param message The message to show
 * @param options Additional toast options
 */
export function showError(message: string, options?: ExternalToast): string | number {
  const id = options?.id || `error-${Date.now()}`;
  return toast.error(message, { 
    ...options, 
    id
  });
}

/**
 * Shows an info toast with a unique ID
 * @param message The message to show
 * @param options Additional toast options
 */
export function showInfo(message: string, options?: ExternalToast): string | number {
  const id = options?.id || `info-${Date.now()}`;
  return toast(message, { 
    ...options, 
    id
  });
}

/**
 * Shows a warning toast with a unique ID
 * @param message The message to show
 * @param options Additional toast options
 */
export function showWarning(message: string, options?: ExternalToast): string | number {
  const id = options?.id || `warning-${Date.now()}`;
  return toast.warning(message, { 
    ...options, 
    id
  });
}

/**
 * Shows a loading toast with a unique ID
 * @param message The message to show
 * @param options Additional toast options
 */
export function showLoading(message: string, options?: ExternalToast): string | number {
  const id = options?.id || `loading-${Date.now()}`;
  return toast.loading(message, { 
    ...options, 
    id
  });
}

/**
 * Dismisses a toast by its ID
 * @param toastId The ID of the toast to dismiss
 */
export function dismissToast(toastId: string | number): void {
  toast.dismiss(toastId);
}

// Export Sonner's toast as well for any other needs
export { toast };

export default {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoading,
  dismiss: dismissToast,
  toast
};

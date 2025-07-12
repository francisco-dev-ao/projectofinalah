
import { toast } from "sonner";

// This is a utility file to help standardize toast usage across the application
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message)
};

// Export the toast for direct usage
export { toast };

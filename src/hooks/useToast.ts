
import { toast } from 'sonner';

export const useToast = () => {
  return {
    toast: {
      success: (message: string) => toast.success(message),
      error: (message: string) => toast.error(message),
      loading: (message: string) => toast.loading(message),
      info: (message: string) => toast.info(message),
      warning: (message: string) => toast.warning(message),
      dismiss: () => toast.dismiss()
    }
  };
};

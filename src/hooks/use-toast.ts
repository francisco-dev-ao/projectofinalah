
// Re-export the toast functionality from sonner
import { toast } from "sonner";

export { toast };
export const useToast = () => {
  return { toast };
};

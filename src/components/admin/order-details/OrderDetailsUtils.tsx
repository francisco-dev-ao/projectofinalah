
import { formatDate as formatLibDate } from "date-fns";

/**
 * Format date helper
 */
export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    
    return new Intl.DateTimeFormat('pt-AO', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric' 
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

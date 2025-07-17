
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Padroniza valores monetários como "25.000 Kz"
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency = "Kz"
): string {
  // Handle null, undefined ou string vazia
  if (value === null || value === undefined || value === "") {
    return `0 Kz`;
  }

  let numValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[\.\s]/g, "").replace(",", "."))
      : value;

  if (isNaN(numValue) || !isFinite(numValue)) {
    numValue = 0;
  }

  // Formatação: ponto para milhar, sem casas decimais
  const formatted = new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(numValue);

  return `${formatted} Kz`;
}

/**
 * Apelido para formatCurrency.
 */
export const formatPrice = formatCurrency;

export function getCurrencySymbol(currency = "KZ"): string {
  return "KZ";
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return "N/A";
  }
  
  return dateObj.toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return "N/A";
  }
  
  return dateObj.toLocaleString("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

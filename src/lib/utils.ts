
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Padroniza valores monetários como "KZ 35.000,00"
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency = "KZ"
): string {
  // Handle null, undefined ou string vazia
  if (value === null || value === undefined || value === "") {
    return `${currency} 0,00`;
  }

  let numValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[\.\s]/g, "").replace(",", "."))
      : value;

  if (isNaN(numValue) || !isFinite(numValue)) {
    numValue = 0;
  }

  // Formatação pt-PT: ponto para milhar, vírgula para decimal, sempre duas casas
  const formatted = new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(numValue);

  return `${currency} ${formatted}`;
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

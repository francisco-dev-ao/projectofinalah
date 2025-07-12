
/**
 * Formata número para moeda padrão "KZ 35.000,00"
 * @param amount valor numérico
 * @param currency código da moeda (padrão: 'KZ')
 * @returns string formatada
 */
export const formatCurrency = (amount: number, currency = 'KZ'): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency} 0,00`;
  }
  
  // Usar pt-PT para formato europeu: ponto para milhares, vírgula para decimais
  const formatted = new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount);

  return `${currency} ${formatted}`;
};

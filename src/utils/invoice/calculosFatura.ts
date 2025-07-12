
/**
 * Funções de apoio para cálculos precisos em faturas
 * Resolve problemas de cálculo e formatação de valores
 */

/**
 * Converte qualquer valor para número de forma segura
 * @param value O valor a ser convertido
 * @param defaultValue Valor padrão caso a conversão falhe
 * @returns Número convertido
 */
export function toNumber(value: any, defaultValue: number = 0): number {
  // Se já for número, retorna diretamente
  if (typeof value === 'number') return value;
  
  // Se for string, tenta converter
  if (typeof value === 'string') {
    // Remove caracteres não numéricos exceto pontos e vírgulas
    const cleaned = value.replace(/[^\d.,]/g, '')
      // Substitui vírgula por ponto para garantir formato correto
      .replace(',', '.');
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  // Caso não seja possível converter, retorna valor padrão
  return defaultValue;
}

/**
 * Calcula o subtotal de itens com maior precisão
 * @param items Lista de itens da fatura
 * @returns Subtotal calculado
 */
export function calcularSubtotal(items: any[]): number {
  if (!Array.isArray(items)) return 0;
  
  return items.reduce((acc: number, item: any) => {
    // Converter explicitamente para número todos os valores
    const quantidade = toNumber(item.quantity, 1);
    const precoUnitario = toNumber(item.unit_price) || toNumber(item.price) || 0;
    
    // Se o item já tem um subtotal definido, usamos ele
    const itemSubtotal = item.subtotal 
      ? toNumber(item.subtotal) 
      : quantidade * precoUnitario;
    
    return acc + itemSubtotal;
  }, 0);
}

/**
 * Formata um valor como moeda angolana (Kwanza)
 * @param value O valor a ser formatado
 * @returns String formatada como moeda
 */
export function formatarMoeda(value: number): string {
  return `KZ ${new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  }).format(value)}`;
}

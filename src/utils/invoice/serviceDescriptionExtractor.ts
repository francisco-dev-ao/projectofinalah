/**
 * Utilitário para extração e formatação de descrições de produtos e serviços
 * Arquivo: src/utils/invoice/serviceDescriptionExtractor.ts
 */
interface ProductData {
  id?: string;
  name?: string;
  description?: string;
  [key: string]: any;
}

/**
 * Extrai a descrição adequada para um serviço/produto a partir de um item de pedido
 * @param item O item do pedido ou fatura
 * @param allProducts Lista opcional de todos os produtos disponíveis para referência
 * @returns Descrição formatada do serviço
 */
import { extrairInfoDominio, formatarDescricaoDominio } from './dominioHelper';

export function extractServiceDescription(item: any, allProducts?: ProductData[]): string {
  try {
    // Prioridade 1: Informações de domínio, que têm formatação especial
    const domainInfo = extrairInfoDominio(item);
    if (domainInfo) {
      return formatarDescricaoDominio(domainInfo);
    }

    const product = item.products || item.product || {};

    // Prioridade 2: Usar o NOME do serviço/produto.
    const serviceName = item.service_name || product.name || item.name;
    if (serviceName && typeof serviceName === 'string' && serviceName.trim()) {
      return serviceName.trim();
    }
    
    // Prioridade 3: Se não houver nome, usar a DESCRIÇÃO mais específica disponível.
    const description = item.service_description || item.description || product.description;
    if (description && typeof description === 'string' && description.trim().length > 2) {
      return description.trim();
    }

    // Último recurso: uma descrição genérica.
    return 'Serviço/Produto';
  } catch (error) {
    console.error('Erro ao extrair descrição do serviço:', error);
    return 'Serviço/Produto';
  }
}

/**
 * Adiciona informações de período à descrição do serviço se disponíveis
 * @param description A descrição atual do serviço
 * @param item O item com possíveis datas
 * @returns Descrição com período adicionado
 */
export function addPeriodToDescription(description: string, item: any): string {
  try {
    const service = item.services || {};
    let period = '';
    
    // Verificar se temos período mencionado explicitamente no item
    if (item.metadata?.period && typeof item.metadata.period === 'string') {
      // Verificar se já é um período formatado ou se precisamos formatá-lo
      if (item.metadata.period.match(/\d+\s*(mes|mês|meses|ano|anos)/i)) {
        return description ? `${description} (${item.metadata.period})` : item.metadata.period;
      }
    }
    
    // Verificar múltiplas fontes possíveis para datas de serviço
    const possibleStartDates = [
      service.start_date,
      item.start_date,
      item.metadata?.start_date,
      item.metadata?.period_start,
      item.metadata?.period?.start,
      item.period_start,
      item.period?.start
    ];
    
    const possibleEndDates = [
      service.end_date,
      item.end_date,
      item.metadata?.end_date,
      item.metadata?.period_end,
      item.metadata?.period?.end,
      item.period_end,
      item.period?.end
    ];
    
    // Encontrar a primeira data de início válida
    let startDate: Date | null = null;
    for (const dateStr of possibleStartDates) {
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          startDate = date;
          break;
        }
      }
    }
    
    // Encontrar a primeira data de término válida
    let endDate: Date | null = null;
    for (const dateStr of possibleEndDates) {
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          endDate = date;
          break;
        }
      }
    }
    
    // Formatação uniforme de data
    const formatDate = (date: Date): string => {
      try {
        // Garantir formato DD/MM/YYYY para consistência 
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      } catch (e) {
        return 'Data inválida';
      }
    };
    
    // Extrair informações de período do texto, caso exista
    if (!period && typeof description === 'string') {
      // Tentar extrair período mensal/anual por menção no texto
      if (description.toLowerCase().includes('anual')) {
        period = 'Anual';
      } else if (description.toLowerCase().includes('mensal')) {
        period = 'Mensal';
      }
      
      // Tentar extrair períodos específicos com datas
      const periodMatch = description.match(/período:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})(\s*até\s*(\d{1,2}\/\d{1,2}\/\d{2,4}))?/i);
      if (periodMatch) {
        period = periodMatch[1];
        if (periodMatch[3]) period += ` até ${periodMatch[3]}`;
      }
      
      // Tentar extrair períodos em meses/anos
      const periodDurationMatch = description.match(/(\d+)\s*(mes|mês|meses|ano|anos)/i);
      if (periodDurationMatch) {
        period = periodDurationMatch[0];
      }
    }
    
    // Verificar período diretamente nos metadados se ainda não temos
    if (!period && item.metadata?.period && typeof item.metadata.period === 'string') {
      // Se já temos um período textual definido
      period = item.metadata.period;
    } 
    // Ou construir com datas de início e término
    else if (!period && startDate) {
      period = formatDate(startDate);
      if (endDate) {
        period += ` até ${formatDate(endDate)}`;
      }
    }
    
    // Adiciona o período à descrição apenas se encontramos um período
    if (period) {
      return period;
    }
    
    return description;
  } catch (error) {
    console.error('Erro ao adicionar informações de período:', error);
    return description;
  }
}

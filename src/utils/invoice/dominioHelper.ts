/**
 * Utilitário para processamento específico de informações de domínios
 */

/**
 * Extrai informações sobre um domínio a partir de metadados ou descrições
 */
interface DomainInfo {
  nome: string;
  periodo?: string;
  tipo?: 'registro' | 'renovação' | 'transferência';
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Extrai informações de domínio a partir de metadados ou descrição
 * @param item Item do pedido que contém informações sobre o domínio
 * @returns Objeto com informações estruturadas do domínio
 */
export function extrairInfoDominio(item: any): DomainInfo | null {
  try {
    // Verificar se é um item de domínio
    const metadata = typeof item.metadata === 'string' 
      ? JSON.parse(item.metadata) 
      : item.metadata || {};
    
    const descricao = item.description || item.service_description || '';
    
    // Verificar se é um serviço de domínio
    const isDominio = 
      descricao.toLowerCase().includes('domínio') ||
      descricao.toLowerCase().includes('dominio') ||
      descricao.toLowerCase().includes('registro') ||
      metadata.domain ||
      (item.name && item.name.toLowerCase().includes('domínio'));
    
    if (!isDominio) return null;
    
    // Extrair nome do domínio
    let domainName = '';
    
    // Primeiro tentar metadata
    if (metadata.domain) {
      domainName = metadata.domain;
    }
    // Depois tentar extrair da descrição
    else {
      const domainMatch = 
        descricao.match(/domínio:?\s+([^\s()]+)/i) ||
        descricao.match(/registro[^:]*:?\s+([^\s()]+)/i) ||
        descricao.match(/registo[^:]*:?\s+([^\s()]+)/i) ||
        descricao.match(/([a-z0-9][-a-z0-9]*\.(?:com|ao|org|net|co\.ao|org\.ao|gov\.ao|it))/i);
        
      if (domainMatch && domainMatch[1]) {
        domainName = domainMatch[1];
      }
    }
    
    // Se não encontrou nome de domínio, não é um item de domínio
    if (!domainName) return null;
    
    // Determinar o tipo (registro, renovação, transferência)
    let tipo: 'registro' | 'renovação' | 'transferência' = 'registro';
    
    if (descricao.toLowerCase().includes('renov')) {
      tipo = 'renovação';
    } else if (descricao.toLowerCase().includes('transfer')) {
      tipo = 'transferência';
    }
    
    // Extrair período
    let periodo = '';
    
    // Verificar metadados primeiro
    if (metadata.period) {
      periodo = metadata.period;
    } 
    // Tentar extrair período da descrição
    else {
      const periodoMatch = 
        descricao.match(/(\d+)\s*(ano|anos|mês|meses|mes|meses)/i) ||
        descricao.match(/(anual|mensal)/i);
        
      if (periodoMatch) {
        periodo = periodoMatch[0];
      }
    }
    
    return {
      nome: domainName,
      periodo: periodo,
      tipo: tipo,
      dataInicio: metadata.start_date || item.start_date,
      dataFim: metadata.end_date || item.end_date
    };
  } catch (error) {
    console.error('Erro ao extrair informações do domínio:', error);
    return null;
  }
}

/**
 * Formata um texto de descrição para um domínio
 * @param domainInfo Objeto com informações do domínio
 * @returns String formatada com a descrição do domínio
 */
export function formatarDescricaoDominio(domainInfo: DomainInfo): string {
  if (!domainInfo || !domainInfo.nome) return 'Serviço de domínio';
  
  let descricao = `${domainInfo.tipo === 'renovação' ? 'Renovação' : domainInfo.tipo === 'transferência' ? 'Transferência' : 'Registro'}: ${domainInfo.nome}`;
  
  if (domainInfo.periodo) {
    descricao += ` (${domainInfo.periodo})`;
  }
  
  return descricao;
}

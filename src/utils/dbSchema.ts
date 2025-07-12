
import { supabase } from "@/integrations/supabase/client";

/**
 * Verifica se uma tabela existe no banco de dados usando a list de tabelas permitidas
 * @param tableName Nome da tabela para verificar
 * @returns Boolean indicando se a tabela existe
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    // Instead of using RPC, check if we can query the table directly
    const { count, error } = await supabase
      .from(tableName as any)
      .select('*', { count: 'exact', head: true });
    
    // If we got a count, the table exists
    return count !== null && error === null;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Verifica se é possível inserir em uma tabela específica
 * @param tableName Nome da tabela
 * @returns Boolean indicando se pode inserir
 */
export async function canInsertIntoTable(tableName: string): Promise<boolean> {
  return await tableExists(tableName);
}

/**
 * Função segura para inserir itens de fatura usando funções Edge
 * @param invoiceId ID da fatura
 * @param items Itens para inserir
 */
export async function safelyInsertInvoiceItems(invoiceId: string, items: any[]): Promise<void> {
  try {
    // Verifica se a tabela invoice_items existe
    const hasInvoiceItemsTable = await tableExists('invoice_items');
    
    if (hasInvoiceItemsTable && items && items.length > 0) {
      // Use Edge function to insert items securely
      await supabase.functions.invoke('insert-invoice-items', {
        body: {
          invoiceId,
          items: items.map(item => ({
            invoice_id: invoiceId,
            service_name: item.service_name || item.name || '',
            service_description: item.service_description || item.description || item.service_name || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            subtotal: (item.quantity || 1) * (item.unit_price || 0),
            start_date: item.start_date || new Date().toISOString(),
            end_date: item.end_date || new Date().toISOString()
          }))
        }
      });
    } else {
      console.log('invoice_items table does not exist, skipping item insertion');
    }
  } catch (error) {
    console.error('Error in safelyInsertInvoiceItems:', error);
  }
}

/**
 * Limpa um objeto para garantir que contenha apenas campos válidos para uma tabela
 * @param tableName Nome da tabela
 * @param obj Objeto a limpar
 * @returns Objeto limpo com apenas campos válidos
 */
export async function cleanObject(tableName: string, obj: Record<string, any>): Promise<Record<string, any>> {
  try {
    // Try to get the first row to examine the structure
    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Error fetching sample from table ${tableName}:`, error);
      return obj;
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      // If no data, we'll just return the object as-is
      return obj;
    }
    
    // Get column names from the first row
    const columnNames = Object.keys(data[0]);
    
    // Filtra o objeto para manter apenas propriedades que correspondem às colunas
    const cleanedObj: Record<string, any> = {};
    
    // Ensure required fields for invoices
    if (tableName === 'invoices') {
      if (!obj.invoice_number) {
        obj.invoice_number = `INV-${Date.now().toString().slice(-6)}`;
      }
      if (!obj.order_id && !obj.customer_id) {
        throw new Error('Either order_id or customer_id is required for invoices');
      }
    }
    
    for (const key in obj) {
      if (columnNames.includes(key)) {
        cleanedObj[key] = obj[key];
      }
    }
    
    return cleanedObj;
  } catch (error) {
    console.error(`Error cleaning object for table ${tableName}:`, error);
    return obj;
  }
}


import { supabase } from "@/integrations/supabase/client";

/**
 * Obtém as colunas de uma tabela específica
 * @param tableName Nome da tabela
 * @returns Um array com os dados das colunas
 */
export async function getTableColumns(tableName: string) {
  try {
    // Instead of using RPC, try to get a sample of the table structure
    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Error fetching columns for ${tableName}:`, error);
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Return column names from the first row
    const columns = Object.keys(data[0]).map(column_name => ({
      column_name,
      data_type: typeof data[0][column_name]
    }));
    
    return columns;
  } catch (error) {
    console.error(`Error in getTableColumns for ${tableName}:`, error);
    return null;
  }
}

/**
 * Obtém os nomes das tabelas públicas
 * @returns Um array com os nomes das tabelas
 */
export async function getPublicTableNames() {
  try {
    // Get list of public tables by trying common tables in the app
    const commonTables = [
      'invoices', 'orders', 'order_items', 'products', 'profiles',
      'company_settings', 'customers', 'payment_methods'
    ];
    
    const results = await Promise.all(commonTables.map(async (table) => {
      try {
        const { count, error } = await supabase
          .from(table as any)
          .select('*', { count: 'exact', head: true });
        
        return error ? null : table;
      } catch {
        return null;
      }
    }));
    
    return results.filter(Boolean);
  } catch (error) {
    console.error('Error in getPublicTableNames:', error);
    return [];
  }
}

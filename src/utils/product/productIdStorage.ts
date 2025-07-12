
import { supabase } from '@/integrations/supabase/client';

// Save generated product ID to the database
export const saveGeneratedProductId = async (productId: string, productType: string, userId: string) => {
  try {
    // Adjust the format to match the expected table structure
    const { error } = await supabase
      .from('generated_product_ids')
      .insert([
        { 
          original_id: productId,
          uuid_id: productId,  // Using productId as both original and UUID for compatibility
          created_at: new Date().toISOString() 
        }
      ]);
    
    if (error) {
      console.error('Error saving product ID:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving product ID:', error);
    return false;
  }
};

// Check if a product ID already exists
export const checkProductIdExists = async (productId: string) => {
  try {
    const { data, error } = await supabase
      .from('generated_product_ids')
      .select('original_id')  // Changed from 'id' to match the table structure
      .eq('original_id', productId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking product ID:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking product ID:', error);
    return false;
  }
};

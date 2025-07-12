import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API GET /api/invoices/data/[invoiceId]
 * 
 * Endpoint para obter os dados de uma fatura específica
 * incluindo informações relacionadas - com tratamento para evitar erros de schema
 */
export async function GET(
  req: NextRequest, 
  { params }: { params: { invoiceId: string } }
) {
  try {
    const { invoiceId } = params;

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'ID da fatura é obrigatório' },
        { status: 400 }
      );
    }

    // Inicializar cliente Supabase com chave de serviço do lado do servidor
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
    );

    // Buscar detalhes da fatura básicos
    const { data: invoiceData, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) {
      console.error('Erro ao buscar dados da fatura:', invoiceError);
      return NextResponse.json(
        { error: `Erro ao buscar dados básicos da fatura: ${invoiceError.message}` },
        { status: 500 }
      );
    }

    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Fatura não encontrada' },
        { status: 404 }
      );
    }

    // Buscar detalhes do pedido separadamente
    const { data: orderData, error: orderError } = invoiceData.order_id 
      ? await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', invoiceData.order_id)
          .single()
      : { data: null, error: null };
    
    // Buscar perfil do cliente (usuário)
    let profileData = null;
    if (orderData?.user_id) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', orderData.user_id)
        .single();
        
      if (!profileError) {
        profileData = profile;
      }
    }
    
    // Buscar itens do pedido separadamente para evitar erros de schema
    let orderItems = [];
    if (orderData?.id) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);
        
      if (!itemsError && items) {
        // Para cada item, buscar informações do produto
        orderItems = await Promise.all(items.map(async (item) => {
          if (item.product_id) {
            const { data: product } = await supabaseAdmin
              .from('products')
              .select('*')
              .eq('id', item.product_id)
              .single();
              
            return {
              ...item,
              product_name: product?.name || 'Produto',
              product_description: product?.description || ''
            };
          }
          return item;
        }));
      }
    }    // Montar um objeto estruturado com os dados necessários para o PDF
    const processedData = {
      ...invoiceData,
      // Adicionar dados manualmente para evitar problemas de esquema/relação
      orders: {
        ...orderData,
        profiles: profileData,
        order_items: orderItems
      },
      // Extrair informações do cliente para acesso fácil
      customer_name: profileData?.name || profileData?.company_name || 'Cliente',
      customer_email: profileData?.email || '',
      // Organizar itens para exibição
      items: orderItems.map((item: any) => ({
        description: item.product_name || item.description || 'Produto/Serviço',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || item.price || 0,
        total: (item.quantity || 1) * (item.unit_price || item.price || 0),
        product_id: item.product_id
      })) || []
    };

    // Retornar dados da fatura
    return NextResponse.json(processedData);
  } catch (error: any) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: `Erro ao processar requisição: ${error.message}` },
      { status: 500 }
    );
  }
}

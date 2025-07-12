import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderByEmail } from '../EmailService';

// Inicializa o cliente Supabase no servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Handler para enviar um pedido por e-mail
 * Endpoint: /api/email/send-order (POST)
 */
export async function POST(request: NextRequest) {
  try {
    // Obter os dados da requisição
    const data = await request.json();
    const { orderId, pdfBase64, additionalRecipients = [] } = data;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar dados do pedido se não enviados
    let order;
    if (data.order) {
      order = data.order;
    } else {
      const { data: fetchedOrder, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:customer_id (*),
          order_items:order_items (*),
          payment_references:payment_references (*)
        `)
        .eq('id', orderId)
        .single();
        
      if (error || !fetchedOrder) {
        return NextResponse.json(
          { error: error?.message || 'Pedido não encontrado' },
          { status: 404 }
        );
      }
      
      order = fetchedOrder;
    }
    
    // Converter o PDF de Base64 para Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // Enviar o e-mail
    const result = await sendOrderByEmail(order, pdfBuffer, additionalRecipients);
    
    // Retornar o resultado
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipients: result.recipients
    });
  } catch (error: any) {
    console.error('Erro ao enviar pedido por e-mail:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar pedido por e-mail' },
      { status: 500 }
    );
  }
}

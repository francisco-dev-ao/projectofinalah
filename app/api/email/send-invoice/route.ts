import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendInvoiceByEmail } from '../EmailService';

// Inicializa o cliente Supabase no servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Handler para enviar uma fatura por e-mail
 * Endpoint: /api/email/send-invoice (POST)
 */
export async function POST(request: NextRequest) {
  try {
    // Obter os dados da requisição
    const data = await request.json();
    const { invoiceId, pdfBase64, requireReference = false, additionalRecipients = [] } = data;
    
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'ID da fatura não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar dados da fatura se não enviados
    let invoice;
    if (data.invoice) {
      invoice = data.invoice;
    } else {
      const { data: fetchedInvoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders:order_id (
            *,
            profiles:customer_id (*),
            order_items:order_items (*),
            payment_references:payment_references (*)
          )
        `)
        .eq('id', invoiceId)
        .single();
        
      if (error || !fetchedInvoice) {
        return NextResponse.json(
          { error: error?.message || 'Fatura não encontrada' },
          { status: 404 }
        );
      }
      
      invoice = fetchedInvoice;
    }
    
    // Converter o PDF de Base64 para Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // Enviar o e-mail
    const result = await sendInvoiceByEmail(invoice, pdfBuffer, requireReference, additionalRecipients);
    
    // Retornar o resultado
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipients: result.recipients
    });
  } catch (error: any) {
    console.error('Erro ao enviar fatura por e-mail:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar fatura por e-mail' },
      { status: 500 }
    );
  }
}

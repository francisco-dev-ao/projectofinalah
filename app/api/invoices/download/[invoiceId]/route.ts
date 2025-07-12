import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInvoicePDF, hasValidPaymentReference } from '../../../../../src/services/print';
import React from 'react';

// Inicializa o cliente Supabase no servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const { invoiceId } = params;

    if (!invoiceId) {
      return new NextResponse(
        JSON.stringify({ error: 'ID da fatura não fornecido' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Buscar dados da fatura
    const { data: invoice, error } = await supabase
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

    if (error || !invoice) {
      return new NextResponse(
        JSON.stringify({ error: error?.message || 'Fatura não encontrada' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    // Verificar se a fatura tem referência de pagamento válida
    // Se requireReference=true, o PDF só será gerado se houver referência válida
    const requireReference = request.nextUrl.searchParams.get('requireReference') === 'true';
    
    if (requireReference && !hasValidPaymentReference(invoice)) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Referência de pagamento não encontrada. Para gerar este documento, é necessário gerar uma referência de pagamento primeiro.' 
        }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Gerar o PDF usando o novo serviço
    const pdfData = await generateInvoicePDF(invoice, requireReference);

    // Retornar o PDF como resposta
    return new NextResponse(pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fatura-${invoice.invoice_number || invoiceId}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('Erro ao gerar PDF da fatura:', error);
    
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Erro ao gerar PDF da fatura' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

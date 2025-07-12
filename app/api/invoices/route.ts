import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * API POST /api/invoices
 * 
 * Endpoint para receber um PDF de fatura gerado pelo cliente
 * e armazená-lo, retornando a URL pública
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar se a requisição é multipart/form-data
    if (!req.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Formato de requisição inválido' },
        { status: 400 }
      );
    }

    // Obter dados do formulário
    const formData = await req.formData();
    const pdfFile = formData.get('pdf') as File;

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'Nenhum arquivo PDF enviado' },
        { status: 400 }
      );
    }

    // Obter metadados opcionais
    const invoiceId = formData.get('invoiceId') as string || '';
    const invoiceNumber = formData.get('invoiceNumber') as string || `INV-${Date.now()}`;

    // Converter File para buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Gerar nome de arquivo único
    const fileName = `fatura-${invoiceNumber}-${Date.now()}.pdf`;
    const filePath = path.join('pdfs', invoiceId || 'temp', fileName);

    // Inicializar cliente Supabase com chave de serviço do lado do servidor
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
    );

    // Verificar e criar bucket se necessário
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'invoices');

    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket('invoices', {
        public: true,
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 10485760 // 10MB
      });
    }

    // Upload do arquivo para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('invoices')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro ao fazer upload do PDF:', uploadError);
      return NextResponse.json(
        { error: `Erro ao fazer upload do PDF: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obter URL pública
    const { data: urlData } = await supabaseAdmin.storage
      .from('invoices')
      .getPublicUrl(filePath);

    // Se temos um ID de fatura, atualizar o registro com a URL do PDF
    if (invoiceId) {
      const { error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({ pdf_url: urlData.publicUrl })
        .eq('id', invoiceId);

      if (updateError) {
        console.warn(`Aviso: Não foi possível atualizar o registro da fatura: ${updateError.message}`);
      }
    }

    // Retornar sucesso com URL
    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      message: 'PDF enviado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao processar PDF:', error);
    return NextResponse.json(
      { error: `Erro ao processar PDF: ${error.message}` },
      { status: 500 }
    );
  }
}

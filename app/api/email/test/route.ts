import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '../EmailService';

/**
 * Handler para enviar um e-mail de teste
 * Endpoint: /api/email/test (POST)
 */
export async function POST(request: NextRequest) {
  try {
    // Obter os dados da requisição
    const data = await request.json();
    const { email } = data;
    
    if (!email) {
      return NextResponse.json(
        { error: 'E-mail de destino não fornecido' },
        { status: 400 }
      );
    }
    
    // Enviar o e-mail de teste
    const result = await sendTestEmail(email);
    
    // Retornar o resultado
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipient: email
    });
  } catch (error: any) {
    console.error('Erro ao enviar e-mail de teste:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar e-mail de teste' },
      { status: 500 }
    );
  }
}

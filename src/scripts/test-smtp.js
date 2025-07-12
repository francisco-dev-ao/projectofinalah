import nodemailer from 'nodemailer';

/**
 * Script para testar a configuração SMTP
 * Execute com: node -r esm scripts/test-smtp.js
 */
async function testSMTPConfiguration() {
  console.log('🧪 Testando a configuração SMTP...');
  
  // Usar as variáveis de ambiente ou valores padrão para teste
  const config = {
    host: process.env.NEXT_PUBLIC_SMTP_HOST || 'mail.angohost.ao',
    port: parseInt(process.env.NEXT_PUBLIC_SMTP_PORT || '465'),
    secure: process.env.NEXT_PUBLIC_SMTP_SECURE === 'true' || true,
    auth: {
      user: process.env.NEXT_PUBLIC_SMTP_USER || 'seu-usuario@angohost.ao',
      pass: process.env.NEXT_PUBLIC_SMTP_PASSWORD || '97z2lh;F4_k5',
    },
  };
  
  console.log('📧 Configuração SMTP:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    pass: '********' // Ocultando a senha por segurança
  });
  
  try {
    // Criar o transportador SMTP
    const transporter = nodemailer.createTransport(config);
    
    // Verificar a conexão
    console.log('🔄 Verificando conexão com o servidor SMTP...');
    await transporter.verify();
    console.log('✅ Conexão SMTP estabelecida com sucesso!');
    
    // Enviar e-mail de teste se a verificação for bem-sucedida
    console.log('📤 Enviando e-mail de teste...');
    
    const emailOptions = {
      from: process.env.NEXT_PUBLIC_SMTP_FROM || 'support@angohost.ao',
      to: 'angohost1@gmail.com', // Email de teste específico
      subject: 'Teste de Configuração SMTP - AppyPay',
      text: `Este é um e-mail de teste enviado em ${new Date().toLocaleString('pt-AO')}.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Teste de E-mail - AppyPay</h2>
          <p>Este é um e-mail de teste para verificar a configuração SMTP.</p>
          <p>Timestamp: <strong>${new Date().toLocaleString('pt-AO')}</strong></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #777; font-size: 12px;">Se você recebeu este e-mail, a configuração SMTP está funcionando corretamente.</p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(emailOptions);
    console.log('✅ E-mail de teste enviado com sucesso!');
    console.log('📋 Detalhes:', {
      messageId: result.messageId,
      envelope: result.envelope,
      accepted: result.accepted,
      rejected: result.rejected
    });
    
  } catch (error) {
    console.error('❌ Erro na configuração SMTP:', error);
    
    // Sugestões de solução com base no erro
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Sugestão: O servidor SMTP está recusando a conexão. Verifique:');
      console.log('1. Se o host e a porta estão corretos');
      console.log('2. Se não há firewall ou proxy bloqueando a conexão');
      console.log('3. Tente a porta alternativa (587 se estiver usando 465, ou vice-versa)');
    }
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n🔧 Sugestão: A conexão com o servidor SMTP expirou. Verifique:');
      console.log('1. Se a rede está estável');
      console.log('2. Se o servidor SMTP está online');
    }
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Sugestão: Erro de autenticação. Verifique:');
      console.log('1. Se o usuário e senha estão corretos');
      console.log('2. Se o servidor requer TLS/SSL (ajuste a configuração "secure")');
      console.log('3. Se há restrições de segurança no servidor de e-mail');
    }
  }
}

// Executar o teste
testSMTPConfiguration();

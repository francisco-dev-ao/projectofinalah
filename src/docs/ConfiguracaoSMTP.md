# Configuração de SMTP para Envio de E-mails

Este documento explica como configurar o sistema de envio de e-mails do AppyPay para enviar faturas, pedidos e notificações aos clientes.

## Configurações Necessárias

As configurações do servidor SMTP devem ser definidas no arquivo `.env.local` na raiz do projeto:

```
# Configurações SMTP para envio de e-mails
NEXT_PUBLIC_SMTP_HOST=mail.angohost.ao
NEXT_PUBLIC_SMTP_PORT=465
NEXT_PUBLIC_SMTP_SECURE=true
NEXT_PUBLIC_SMTP_USER=seu-usuario@angohost.ao
NEXT_PUBLIC_SMTP_PASSWORD=97z2lh;F4_k5
NEXT_PUBLIC_SMTP_FROM=support@angohost.ao
```

> **Nota importante**: O servidor mail.angohost.ao suporta tanto a porta 465 (SSL) quanto a 587 (TLS). Recomendamos inicialmente usar a 465 com SMTP_SECURE=true. Caso tenha problemas, tente a porta 587 com SMTP_SECURE=false.

## Serviços SMTP Recomendados

Você pode utilizar qualquer um dos seguintes serviços de SMTP:

### Servidor AngoHost (Recomendado)

O servidor mail.angohost.ao é a opção recomendada para este projeto:

- **Host**: mail.angohost.ao
- **Porta**: 465 (SSL, recomendado) ou 587 (TLS)
- **Seguro**: true (para porta 465) ou false (para porta 587)
- **Autenticação**: Requer nome de usuário e senha

#### Dicas para o Servidor AngoHost

- Certifique-se de que seu endereço de e-mail esteja corretamente configurado no painel de controle do AngoHost
- Para melhor entrega, configure corretamente os registros SPF e DKIM no seu domínio
- Se encontrar problemas com a porta 465, tente a porta 587 alternando o parâmetro SMTP_SECURE para false
- Para problemas persistentes, entre em contato com o suporte do AngoHost em suporte@angohost.ao

### Outras Opções de Serviços SMTP

1. **Amazon SES**: Boa opção para escala e confiabilidade
   - Host: email-smtp.us-east-1.amazonaws.com
   - Porta: 587 (TLS) ou 465 (SSL)

2. **SendGrid**: Oferece uma API robusta e ferramentas de analytics
   - Host: smtp.sendgrid.net
   - Porta: 587 (TLS) ou 465 (SSL)

3. **Mailgun**: Boa performance e fácil integração
   - Host: smtp.mailgun.org
   - Porta: 587 (TLS)

4. **SMTP do G Suite/Gmail**: Para volumes menores
   - Host: smtp.gmail.com
   - Porta: 587 (TLS) ou 465 (SSL)
   - *Observação*: Para Gmail, pode ser necessário habilitar "Acesso a app menos seguro" ou usar senhas de aplicativo

## Funcionalidades Disponíveis

O sistema de e-mails suporta:

1. **Envio de Faturas**: Envia a fatura como PDF anexado ao cliente
   - A referência de pagamento é incluída no corpo do e-mail
   - Função: `PrintService.sendInvoiceByEmail(invoice, requireReference, additionalRecipients)`

2. **Envio de Pedidos**: Envia detalhes do pedido como PDF anexado
   - Função: `PrintService.sendOrderByEmail(order, additionalRecipients)`

3. **Envio Automático**: O sistema pode ser configurado para enviar automaticamente faturas após a criação
   - Configure `auto_send_invoices` na tabela `company_settings`

4. **E-mails Adicionais**: Pode-se enviar cópias para outros e-mails além do cliente
   - Use o parâmetro `additionalRecipients` nas funções de envio

## Como Usar

### Enviar Fatura por E-mail

```typescript
import PrintService from '@/services/PrintService';

// Buscar a fatura do banco de dados
const { data: invoice } = await supabase
  .from('invoices')
  .select(`*, orders(*, profiles:user_id (*), payment_references (*), order_items(*))`)
  .eq('id', invoiceId)
  .single();

// Enviar por e-mail
const result = await PrintService.sendInvoiceByEmail(
  invoice,           // A fatura completa
  false,             // Não exigir referência de pagamento
  ['copia@email.com'] // E-mails adicionais para receber cópia
);

console.log(`E-mail enviado para: ${result.recipients.join(', ')}`);
```

### Interface de Usuário

O componente `InvoiceEmailButton` já está integrado com essa funcionalidade:

```tsx
<InvoiceEmailButton 
  invoiceId={invoice.id} 
  invoiceNumber={invoice.invoice_number}
/>
```

## Interface de Configuração SMTP

O sistema inclui uma interface administrativa para configuração SMTP, disponível em `/admin/settings/email` ou diretamente pelo componente `SMTPConfigurationForm`:

### Recursos do Formulário de Configuração

1. **Configuração Básica**:
   - Host SMTP (mail.angohost.ao)
   - Porta (465 ou 587)
   - Usuário e senha
   - E-mail de origem
   - Opção de conexão segura (SSL/TLS)

2. **Configurações Avançadas**:
   - Envio automático de faturas
   - Outras opções de personalização

3. **Teste da Configuração**:
   - Envio de e-mail de teste para qualquer endereço
   - Feedback imediato sobre o status do envio

### Como Utilizar o Formulário de Configuração

1. Acesse a área de configurações de e-mail no painel administrativo
2. Preencha os campos com as informações do servidor SMTP do AngoHost:
   - **Host**: mail.angohost.ao
   - **Porta**: 465
   - **Conexão Segura**: Ativada (para porta 465)
   - **Usuário**: seu-usuario@angohost.ao
   - **Senha**: 97z2lh;F4_k5
   - **E-mail de Origem**: noreply@angohost.ao (ou seu endereço preferido)
3. Salve as configurações
4. Envie um e-mail de teste para verificar o funcionamento

### Implementação em Novas Páginas

Para adicionar o formulário de configuração SMTP em uma página existente:

```tsx
import SMTPConfigurationForm from '@/components/admin/SMTPConfigurationForm';

export default function EmailSettingsPage() {
  return (
    <div>
      <h1>Configurações de E-mail</h1>
      <SMTPConfigurationForm />
    </div>
  );
}
```

## Testando a Configuração SMTP

Para verificar se sua configuração SMTP está funcionando corretamente, você pode usar o script de teste incluído no projeto:

### Usando o Script de Teste

1. Primeiro, instale as dependências necessárias (caso ainda não tenha):
   ```bash
   npm install nodemailer esm
   ```

2. Edite o arquivo `src/scripts/test-smtp.js` para adicionar um e-mail de destino válido para teste:
   ```javascript
   to: 'seu-email@example.com', // Substitua por seu e-mail para teste
   ```

3. Execute o script de teste:
   ```bash
   node -r esm src/scripts/test-smtp.js
   ```

4. Verifique o resultado:
   - Se a configuração estiver correta, você verá a mensagem "✅ E-mail de teste enviado com sucesso!"
   - Em caso de erro, o script mostrará sugestões de solução com base no tipo de erro encontrado

### Testando Diretamente no Código

Você também pode testar o envio de um e-mail diretamente em seu código:

```typescript
import PrintService from '@/services/PrintService';

// Teste simples
try {
  const result = await PrintService.sendTestEmail('destinatario@example.com');
  console.log('E-mail enviado com sucesso:', result);
} catch (error) {
  console.error('Erro ao enviar e-mail de teste:', error);
}
```

## Solução de Problemas

1. **E-mails não enviados**:
   - Verifique as credenciais SMTP no arquivo `.env.local`
   - Certifique-se de que a porta não está bloqueada pelo firewall
   - Para Gmail, verifique se a autenticação em duas etapas está configurada corretamente

2. **Erros de Conexão SMTP**:
   - Verifique se o valor de SMTP_SECURE está correto para o servidor escolhido
   - Tente alternar entre as portas 587 e 465

3. **E-mails na pasta de spam**:
   - Configure corretamente o campo "From" com um domínio válido
   - Considere configurar registros SPF e DKIM para seu domínio

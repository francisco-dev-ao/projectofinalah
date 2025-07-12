# Sistema de Geração de PDF do AngoHost

Esta documentação descreve o novo sistema de geração de PDF implementado no AngoHost que substitui o sistema antigo baseado em Supabase Edge Functions e Puppeteer.

## Visão Geral

O novo sistema foi projetado para:

1. Gerar PDFs diretamente no navegador usando jsPDF + autotable
2. Remover dependências externas (edge functions)
3. Melhorar a consistência e performance
4. Facilitar manutenção e personalização

## Estrutura de Arquivos

- **`src/utils/pdfGenerator.ts`**: Classe principal que gera os PDFs usando jsPDF
- **`src/utils/downloadHelpers.ts`**: Utilitários para download de PDFs
- **`src/utils/storageUtils.ts`**: Utilitários para gerenciamento de buckets de armazenamento
- **`src/utils/InvoicePdfGenerator.ts`**: (Compatibilidade legada) - Será removido no futuro

## Como Usar

### Para gerar e baixar um PDF de fatura:

```typescript
import { downloadHelpers } from '@/utils/downloadHelpers';

// Onde invoiceData é o objeto de fatura com todas as informações necessárias
await downloadHelpers.downloadInvoicePDF(invoiceData);
```

### Importação correta para criar PDFs personalizados:

```typescript
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

function criarPDF() {
  const doc = new jsPDF();
  
  // Adicionando tabelas com autotable
  autoTable(doc, {
    head: [['Coluna 1', 'Coluna 2']],
    body: [
      ['Valor 1', 'Valor 2'],
      ['Valor 3', 'Valor 4']
    ]
  });
  
  return doc.output('arraybuffer');
}
```

> **IMPORTANTE:** Lembre-se de usar `autoTable(doc, {options})` ao invés do método descontinuado `doc.autoTable({options})`.

### Para gerar um PDF de pedido:

```typescript
import { downloadHelpers } from '@/utils/downloadHelpers';

// Onde orderData é o objeto de pedido com todas as informações necessárias
await downloadHelpers.downloadOrderPDF(orderData);
```

### Para gerar apenas o buffer PDF (sem download):

```typescript
import { PDFGenerator } from '@/utils/pdfGenerator';

// Gerar buffer de PDF de fatura
const pdfBuffer = await PDFGenerator.generateInvoicePDF(invoice);

// Gerar buffer de PDF de pedido
const pdfBuffer = await PDFGenerator.generateOrderPDF(order);
```

## APIs de Servidor

As seguintes APIs foram atualizadas para gerar PDFs diretamente:

- `pages/api/invoices/download/[invoiceId].ts` (Pages Router)
- `app/api/invoices/download/[invoiceId]/route.ts` (App Router)

## Arquivos Obsoletos

Os seguintes arquivos estão marcados para remoção em versões futuras:

- `src/utils/InvoicePdfGenerator.ts` - Use `PDFGenerator` em vez disso
- `supabase/functions/generate-invoice-pdf/index.ts` - Edge function não é mais necessária

## Customização

Para personalizar a aparência dos PDFs, edite o arquivo `src/utils/pdfGenerator.ts`. A classe PDFGenerator contém métodos para ajustar:

- Cores
- Fontes
- Layout
- Cabeçalhos/Rodapés
- Formatação de valores

---

*Última atualização: Maio de 2025*

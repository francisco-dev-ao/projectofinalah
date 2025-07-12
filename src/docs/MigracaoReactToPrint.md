# Migração para React-to-Print

Este documento descreve como migrar o sistema de geração de PDF do jsPDF para o react-to-print.

## Visão Geral

A migração envolve a substituição de:
- jsPDF e jsPDF-autotable
- Por react-to-print e html2canvas

Essas novas bibliotecas oferecem várias vantagens:
- Melhor controle sobre o layout usando CSS padrão
- Facilidade de manutenção (sem código imperativo de posicionamento)
- Melhor consistência visual entre a visualização na tela e o documento impresso
- Manutenção mais simples

## Componentes Criados

1. **InvoicePrintTemplate** - Para renderizar faturas
2. **OrderPrintTemplate** - Para renderizar pedidos
3. **ServicePrintTemplate** - Para renderizar serviços

## Serviço de Impressão

O novo serviço de impressão (`PrintService.tsx`) fornece funções que são compatíveis com a API anterior:

### Funções Disponíveis

- **generateInvoicePDF(invoice)** - Gera PDF de fatura
- **generateOrderPDF(order)** - Gera PDF de pedido
- **generateServicePDF(service)** - Gera PDF de serviço
- **printInvoice(invoice)** - Imprime uma fatura diretamente
- **printOrder(order)** - Imprime um pedido diretamente
- **printService(service)** - Imprime um serviço diretamente

### Hooks para Uso em Componentes React

Também foram criados hooks para facilitar a impressão em componentes React:

```tsx
import { usePrintInvoice } from '@/services/PrintService';

function InvoiceComponent({ invoice }) {
  const { PrintComponent, handlePrint } = usePrintInvoice(invoice);
  
  return (
    <>
      <button onClick={handlePrint}>Imprimir Fatura</button>
      {PrintComponent} {/* Adiciona o componente invisível ao DOM */}
    </>
  );
}
```

## Como Usar

### Para Gerar PDFs em APIs ou Serviços

```tsx
import { generateInvoicePDF } from '@/services/PrintService';

// Em um API endpoint
export async function GET(request, { params }) {
  const { invoiceId } = params;
  const invoice = await getInvoiceById(invoiceId);
  
  // Gerar PDF
  const pdfData = await generateInvoicePDF(invoice);
  
  // Retornar como resposta
  return new Response(pdfData, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fatura-${invoice.invoice_number}.pdf"`
    }
  });
}
```

### Para Impressão em Componentes

```tsx
import { printInvoice } from '@/services/PrintService';

function InvoiceActions({ invoice }) {
  const handlePrintClick = async () => {
    try {
      await printInvoice(invoice);
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      // Mostrar mensagem de erro ao usuário
    }
  };
  
  return (
    <button onClick={handlePrintClick}>
      Imprimir Fatura
    </button>
  );
}
```

### Usando os Hooks React

```tsx
import { usePrintInvoice } from '@/services/PrintService';

function InvoiceView({ invoice }) {
  const { PrintComponent, handlePrint } = usePrintInvoice(invoice);
  
  return (
    <div>
      <h2>Fatura #{invoice.invoice_number}</h2>
      
      <button onClick={handlePrint}>
        Imprimir Fatura
      </button>
      
      {/* O componente invisível que será impresso */}
      {PrintComponent}
    </div>
  );
}
```

## Estilos de Impressão

Os estilos de impressão estão definidos em arquivos CSS específicos:
- `InvoicePrintTemplate.module.css` para faturas
- `PrintTemplates.module.css` para pedidos e serviços

Você pode personalizar a aparência dos documentos modificando esses arquivos CSS.

## Considerações de Compatibilidade

A nova implementação mantém a mesma assinatura de API que a implementação antiga com jsPDF, então a migração deve ser transparente para o resto do código. Os mesmos parâmetros são aceitos e o mesmo formato de retorno é fornecido.

## Requisitos

Para usar este sistema, você precisa das seguintes dependências:
- react-to-print
- html2canvas

Instale com:

```bash
npm install react-to-print html2canvas
```

# Migração do Sistema de PDF - Maio 2025

Em 21/05/2025, o sistema de geração de PDF do AngoHost foi atualizado para usar uma abordagem baseada em cliente usando jsPDF + autotable.

## Arquivos Atualizados
- `src/utils/pdfGenerator.ts` - Novo sistema principal 
- `src/utils/downloadHelpers.ts` - Utilitários para download
- `src/utils/storageUtils.ts` - Utilitários para buckets
- `src/hooks/useInvoices.ts` - Atualizado para novo sistema
- `src/pages/SharedInvoiceView.tsx` - Atualizado para novo sistema
- `src/pages/customer/InvoiceDetails.tsx` - Atualizado para novo sistema
- `pages/api/invoices/download/[invoiceId].ts` - API atualizada
- `app/api/invoices/download/[invoiceId]/route.ts` - API atualizada
- `src/utils/invoice/invoicePdfGenerator.ts` - Atualizado para novo sistema
- `src/services/invoice/pdfGeneration.ts` - Atualizado para novo sistema
- `src/components/invoice/InvoicePrintButton.tsx` - Atualizado para novo sistema
- `src/components/customer/InvoiceRegeneratePdfButton.tsx` - Atualizado para novo sistema

## Arquivos para Remoção Futura
- `src/utils/InvoicePdfGenerator.ts` (mantido temporariamente para compatibilidade)
- `supabase/functions/generate-invoice-pdf/index.ts` (edge function obsoleta)

## Correções Importantes
- Corrigido o problema com jspdf-autotable para usar a importação correta com `import { autoTable } from 'jspdf-autotable'`
- Ajustado o código para usar `autoTable(doc, options)` em vez de `doc.autoTable(options)`

## Benefícios
- PDF gerado diretamente no navegador sem depender de servidores externos
- Performance melhorada
- Redução de custos (sem uso de edge functions)
- Personalização mais fácil
- Consistência entre diferentes pontos de geração de PDF

## Observações
- A documentação completa está disponível em `src/utils/README-PDF.md`

import { test, expect } from '@playwright/test';

test('verifica se a página carrega corretamente', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
});

// Teste: a referência exibida no PDF deve ser igual à referência gerada
import { InvoicePDFGenerator } from '../src/services/invoice/pdf/pdfGenerator';

test('A referência exibida no PDF é igual à referência gerada', () => {
  // Simula uma referência gerada
  const referenciaGerada = '123456789';
  const invoice = {
    invoice_number: 'FAT-001',
    created_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 86400000).toISOString(),
    status: 'pending',
    amount: 10000,
    orders: {
      total_amount: 10000,
      payment_references: [
        {
          reference: referenciaGerada,
          created_at: new Date().toISOString(),
        }
      ],
      profiles: { name: 'Cliente Teste', email: 'cliente@teste.com' },
      order_items: []
    }
  };
  const invoiceItems = [];
  const companySettings = { company_name: 'Empresa Teste' };

  // Mock jsPDF para capturar o texto
  let textoReferencia = '';
  class MockPDF {
    setFont() {}
    setFontSize() {}
    text(txt, x, y) {
      if (txt.startsWith('Referência:')) {
        textoReferencia = txt;
      }
    }
    addImage() {}
    output() { return new Uint8Array(); }
    internal = { pageSize: { height: 297 }, pages: [1] };
    setPage() {}
  }
  // Substitui jsPDF por MockPDF
  const originalJsPDF = global.jsPDF;
  (global as any).jsPDF = MockPDF;

  // Executa geração do PDF
  const generator = new InvoicePDFGenerator();
  (generator as any)['doc'] = new MockPDF();
  generator.generatePDF(invoice, invoiceItems, companySettings);

  // Restaura jsPDF
  (global as any).jsPDF = originalJsPDF;

  // Verifica se a referência exibida é igual à gerada
  expect(textoReferencia).toBe(`Referência: ${referenciaGerada}`);
});
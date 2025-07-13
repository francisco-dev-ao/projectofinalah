import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import InvoicePrintTemplate from '@/components/invoice/InvoicePrintTemplate';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Hook para usar o componente de impressão de fatura
 */
export const usePrintInvoice = (invoice: any) => {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    documentTitle: `Fatura_${invoice.invoice_number || invoice.id}`,
    // @ts-ignore - A tipagem está incorreta, mas a prop content existe
    content: () => componentRef.current,
  });
  
  const PrintComponent = (
    <div style={{ display: 'none' }}>
      <div ref={componentRef}>
        <InvoicePrintTemplate invoice={invoice} />
      </div>
    </div>
  );
  
  return {
    PrintComponent,
    handlePrint,
    componentRef
  };
};

/**
 * Atualiza a referência de pagamento na fatura
 */
const updateInvoiceReference = async (invoice: any): Promise<any> => {
  // Verificar e atualizar a referência de pagamento
  if (invoice.orders?.payment_references && invoice.orders.payment_references.length > 0) {
    const latestRef = invoice.orders.payment_references
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    invoice.payment_reference = latestRef.reference;
    
    // Atualizar a referência no banco de dados
    try {
      await supabase
        .from('invoices')
        .update({ 
          payment_reference: invoice.payment_reference,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);
    } catch (error) {
      console.error('Erro ao salvar referência na fatura:', error);
    }
  }
  
  // Verificar se existe referência válida, se não usar placeholder
  if (!invoice.payment_reference) {
    console.warn('No payment reference found, will use placeholder');
    invoice.payment_reference = 'Pendente';
  }
  
  return invoice;
};

/**
 * Gera um PDF a partir do componente React
 */
export const generateInvoicePDF = async (invoice: any): Promise<Uint8Array> => {
  try {
    // Atualizar a referência
    invoice = await updateInvoiceReference(invoice);
    
    // Criar um elemento temporário para renderizar o componente
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    return new Promise<Uint8Array>((resolve, reject) => {
      // Renderizar o componente no elemento temporário
      const ReactDOM = require('react-dom');
      ReactDOM.render(
        <InvoicePrintTemplate invoice={invoice} />,
        tempDiv,
        async () => {
          try {
            // Converter para canvas
            const canvas = await html2canvas(tempDiv, {
              scale: 2,
              logging: false,
              useCORS: true
            });
            
            // Criar o PDF
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = canvas.height * imgWidth / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            
            // Se a imagem for maior que uma página A4, adicionar páginas adicionais
            let heightLeft = imgHeight - pageHeight;
            let position = -pageHeight;
            
            while (heightLeft > 0) {
              position = position - pageHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            
            // Converter para Uint8Array
            const pdfData = pdf.output('arraybuffer');
            
            // Limpar o elemento temporário
            ReactDOM.unmountComponentAtNode(tempDiv);
            document.body.removeChild(tempDiv);
            
            resolve(new Uint8Array(pdfData));
          } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            if (tempDiv.parentNode) {
              ReactDOM.unmountComponentAtNode(tempDiv);
              document.body.removeChild(tempDiv);
            }
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Erro ao preparar geração de PDF:', error);
    throw error;
  }
};

/**
 * Imprime uma fatura diretamente
 */
export const printInvoice = async (invoice: any): Promise<void> => {
  try {
    // Atualizar a referência
    invoice = await updateInvoiceReference(invoice);
    
    const { handlePrint, PrintComponent } = usePrintInvoice(invoice);
    
    // Criar um elemento temporário para renderizar o componente
    const tempDiv = document.createElement('div');
    document.body.appendChild(tempDiv);
    
    // Renderizar o componente e imprimir
    const ReactDOM = require('react-dom');
    ReactDOM.render(
      PrintComponent,
      tempDiv,
      () => {
        handlePrint();
        
        // Limpar após a impressão (com um pequeno atraso)
        setTimeout(() => {
          ReactDOM.unmountComponentAtNode(tempDiv);
          document.body.removeChild(tempDiv);
        }, 1000);
      }
    );
  } catch (error) {
    console.error('Erro ao imprimir fatura:', error);
    throw error;
  }
};

/**
 * Objeto de serviço compatível com o padrão antigo
 */
const PrintService = {
  printInvoice,
  downloadInvoicePDF: generateInvoicePDF,
  usePrintInvoice
};

export default PrintService;

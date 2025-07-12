// src/pages/invoices/preview/[invoiceId].tsx
import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import InvoicePrintTemplate from '@/components/invoice/InvoicePrintTemplate';
import { useReactToPrint } from 'react-to-print';
import { updateInvoiceReference } from '@/services/print';

/**
 * Página de visualização de fatura para impressão
 * Esta página é projetada para ser aberta em uma nova janela
 */
export default function InvoicePreview() {
  // Get invoiceId from URL without using router
  const invoiceId = window.location.pathname.split('/').pop();
  // Get requireReference from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const requireReference = searchParams.get('requireReference') !== 'false';
  
  const [invoice, setInvoice] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Função para buscar os dados da fatura
  useEffect(() => {
    if (!invoiceId) return;
    
    const fetchInvoice = async () => {
      try {
        const { data, error } = await supabase
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
          
        if (error) throw error;
        if (!data) throw new Error('Fatura não encontrada');
        
        // Atualizar a referência se necessário
        const updatedInvoice = await updateInvoiceReference(data, requireReference);
        
        setInvoice(updatedInvoice);
      } catch (err: any) {
        console.error('Erro ao buscar fatura:', err);
        setError(err.message || 'Erro ao carregar a fatura');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoice();
  }, [invoiceId, requireReference]);
  
  // Hook para imprimir a página
  const handlePrint = useReactToPrint({
    documentTitle: `Fatura ${invoice?.invoice_number || invoiceId}`,
    onAfterPrint: () => {
      console.log('Impressão concluída');
    },
    // @ts-ignore - content is a valid prop but TypeScript doesn't recognize it
    content: () => componentRef.current,
  });
  
  // Iniciar a impressão automaticamente quando os dados estiverem prontos
  useEffect(() => {
    if (invoice && !loading && !error) {
      // Pequeno delay para garantir que o componente esteja renderizado
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [invoice, loading, error, handlePrint]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>Carregando fatura...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center bg-red-50 p-6 rounded-lg border border-red-200">
          <h1 className="text-red-600 text-xl font-bold mb-2">Erro</h1>
          <p>{error}</p>
          <button 
            className="mt-4 bg-gray-200 px-4 py-2 rounded"
            onClick={() => window.close()}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h1 className="text-yellow-600 text-xl font-bold mb-2">Fatura não encontrada</h1>
          <button 
            className="mt-4 bg-gray-200 px-4 py-2 rounded"
            onClick={() => window.close()}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="p-4 bg-gray-100 flex justify-between items-center print:hidden">
        <h1 className="text-xl font-bold">Visualização da Fatura #{invoice.invoice_number}</h1>
        <div>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
          >
            Imprimir
          </button>
          <button
            onClick={() => window.close()}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Fechar
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div ref={componentRef}>
          <InvoicePrintTemplate invoice={invoice} />
        </div>
      </div>
    </div>
  );
}

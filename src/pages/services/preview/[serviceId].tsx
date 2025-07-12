// src/pages/services/preview/[serviceId].tsx
import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ServicePrintTemplate from '@/components/service/ServicePrintTemplate';
import { useReactToPrint } from 'react-to-print';

/**
 * Página de visualização de serviço para impressão
 * Esta página é projetada para ser aberta em uma nova janela
 */
export default function ServicePreview() {
  // Get serviceId from URL without using router
  const serviceId = window.location.pathname.split('/').pop();
  const [service, setService] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Função para buscar os dados do serviço
  useEffect(() => {
    if (!serviceId) return;
    
    const fetchService = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select(`
            *,
            customer:customer_id (*)
          `)
          .eq('id', serviceId)
          .single();
          
        if (error) throw error;
        if (!data) throw new Error('Serviço não encontrado');
        
        setService(data);
      } catch (err: any) {
        console.error('Erro ao buscar serviço:', err);
        setError(err.message || 'Erro ao carregar o serviço');
      } finally {
        setLoading(false);
      }
    };
    
    fetchService();
  }, [serviceId]);
  
  // Hook para imprimir a página
  const handlePrint = useReactToPrint({
    documentTitle: `Serviço ${service?.service_number || serviceId}`,
    onAfterPrint: () => {
      console.log('Impressão concluída');
    },
    // @ts-ignore - content is a valid prop but TypeScript doesn't recognize it
    content: () => componentRef.current,
  });
  
  // Iniciar a impressão automaticamente quando os dados estiverem prontos
  useEffect(() => {
    if (service && !loading && !error) {
      // Pequeno delay para garantir que o componente esteja renderizado
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [service, loading, error, handlePrint]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>Carregando serviço...</p>
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
  
  if (!service) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h1 className="text-yellow-600 text-xl font-bold mb-2">Serviço não encontrado</h1>
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
        <h1 className="text-xl font-bold">Visualização do Serviço #{service.service_number}</h1>
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
          <ServicePrintTemplate service={service} />
        </div>
      </div>
    </div>
  );
}

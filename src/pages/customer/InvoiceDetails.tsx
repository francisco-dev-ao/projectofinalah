import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useInvoices } from '@/hooks/useInvoices';
import { useInvoiceBucket } from '@/hooks/useInvoiceBucket';
// PDF functionality removed - using print reference instead
import InvoiceDetailsHeader from '@/components/invoice/InvoiceDetailsHeader';
import InvoiceCompanyInfo from '@/components/invoice/InvoiceCompanyInfo';
import InvoiceItemsTable from '@/components/invoice/InvoiceItemsTable';
import InvoicePaymentInfo from '@/components/invoice/InvoicePaymentInfo';
import { AlertTriangle } from 'lucide-react';

const InvoiceDetails = () => {
  const { id: invoiceId } = useParams<{ id: string }>();
  
  // Debug logs
  console.log('InvoiceDetails: URL params:', useParams());
  console.log('InvoiceDetails: Invoice ID from params:', invoiceId);
  
  const [invoice, setInvoice] = useState<any | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const { user } = useAuth();
  const { downloadInvoice, shareInvoice, isSharing } = useInvoices(user?.id);
  const { isInitializing, isInitialized, initializeInvoiceBucket } = useInvoiceBucket();

  useEffect(() => {
    console.log('InvoiceDetails: useEffect triggered', { 
      invoiceId, 
      user: user?.id
    });
    
    if (!invoiceId) {
      console.error('InvoiceDetails: No invoiceId found in URL params');
      setError('ID da fatura não encontrado na URL');
      setLoading(false);
      return;
    }
    
    if (!isInitialized && !isInitializing) {
      console.log('InvoiceDetails: Initializing invoice bucket');
      initializeInvoiceBucket();
    }
    
    if (user) {
      console.log('InvoiceDetails: Fetching invoice details for ID:', invoiceId);
      fetchInvoiceDetails();
      fetchCompanyInfo();
    } else {
      console.log('InvoiceDetails: No user found, waiting for authentication');
    }
  }, [invoiceId, user, isInitialized, isInitializing]);

  const fetchInvoiceDetails = async () => {
    if (!invoiceId) {
      console.error('InvoiceDetails: No invoiceId provided to fetchInvoiceDetails');
      setError('ID da fatura não fornecido');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('InvoiceDetails: Starting fetch for invoice:', invoiceId);
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders:order_id (
            *,
            order_items(*)
          )
        `)
        .eq('id', invoiceId)
        .single();
      
      console.log('InvoiceDetails: Query result:', { data, error });
      
      if (error) {
        console.error('InvoiceDetails: Error fetching invoice:', error);
        setError(`Erro ao carregar fatura: ${error.message}`);
        toast.error('Não foi possível carregar os detalhes da fatura');
        return;
      }
      
      if (!data) {
        console.error('InvoiceDetails: No data returned for invoice');
        setError('Fatura não encontrada');
        toast.error('Fatura não encontrada');
        return;
      }
      
      console.log('InvoiceDetails: Invoice data loaded:', data);
      console.log('InvoiceDetails: Order user_id:', data?.orders?.user_id, 'Current user:', user?.id);
      
      // Verificar se o usuário tem permissão para ver esta fatura
      if (data?.orders?.user_id !== user?.id) {
        console.error('InvoiceDetails: Permission denied - user mismatch');
        setError('Você não tem permissão para ver esta fatura');
        toast.error('Você não tem permissão para ver esta fatura');
        return;
      }
      
      setInvoice(data);
      setOrder(data?.orders || null);
      console.log('InvoiceDetails: Invoice and order data set successfully');
    } catch (error: any) {
      console.error('InvoiceDetails: Exception in fetchInvoiceDetails:', error);
      setError(`Erro ao carregar detalhes da fatura: ${error.message}`);
      toast.error(`Erro ao carregar detalhes da fatura`);
    } finally {
      setLoading(false);
      console.log('InvoiceDetails: Fetch completed, loading set to false');
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      console.log('InvoiceDetails: Fetching company info');
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('InvoiceDetails: Error fetching company info:', error);
      }
      
      if (data) {
        console.log('InvoiceDetails: Company info loaded:', data);
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('InvoiceDetails: Exception in fetchCompanyInfo:', error);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoice) return;
    
    try {
      console.log('InvoiceDetails: Starting download for invoice:', invoice.id);
      await downloadInvoice(invoice.id, invoice.invoice_number);
    } catch (error) {
      console.error('InvoiceDetails: Error downloading invoice:', error);
      toast.error('Erro ao baixar fatura');
    }
  };


  const handleShareInvoice = async () => {
    if (!invoice) return;
    
    try {
      console.log('InvoiceDetails: Sharing invoice:', invoice.id);
      await shareInvoice(invoice.id);
    } catch (error) {
      console.error('InvoiceDetails: Error sharing invoice:', error);
      toast.error('Erro ao compartilhar fatura');
    }
  };

  const handlePrintInvoice = async () => {
    if (!invoice) return;
    
    try {
      setIsPrinting(true);
      console.log('InvoiceDetails: Printing invoice:', invoice.id);
      const { downloadHelpers } = await import("@/utils/downloadHelpers");
      
      // Buscar dados completos da fatura com referências de pagamento
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            payment_references (*),
            order_items (*)
          )
        `)
        .eq('id', invoice.id)
        .single();
        
      if (error) throw new Error(`Erro ao carregar fatura: ${error.message}`);
      
      // Usar a função de impressão direta
      await downloadHelpers.printInvoiceDirectly(invoiceData);
      toast.success('Abrindo janela de impressão...');
      
    } catch (error: any) {
      console.error('InvoiceDetails: Error printing invoice:', error);
      toast.error(error.message || 'Erro ao imprimir fatura. Por favor, tente novamente.');
    } finally {
      setIsPrinting(false);
    }
  };

  console.log('InvoiceDetails: Render state:', { 
    loading, 
    error, 
    invoice: !!invoice, 
    order: !!order,
    invoiceId,
    userId: user?.id
  });

  if (!invoiceId) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              URL Inválida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">ID da fatura não encontrado na URL.</p>
            <p className="text-sm text-red-600 mt-2">URL atual: {window.location.pathname}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Carregando detalhes da fatura...</p>
        <p className="text-sm text-gray-500">ID da fatura: {invoiceId}</p>
        <p className="text-xs text-gray-400">Usuário: {user?.id}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-2">ID da fatura: {invoiceId}</p>
            <p className="text-xs text-red-500 mt-1">Usuário: {user?.id}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice || !order) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Fatura não encontrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              A fatura solicitada não existe ou você não tem permissão para visualizá-la.
            </p>
            <p className="text-sm text-red-600 mt-2">ID da fatura: {invoiceId}</p>
            <p className="text-xs text-red-500 mt-1">Usuário: {user?.id}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <InvoiceDetailsHeader
        invoice={invoice}
        isGeneratingPDF={isGeneratingPDF}
        isSharing={isSharing}
        isPrinting={isPrinting}
        onDownload={handleDownloadInvoice}
        onShare={handleShareInvoice}
        onPrint={handlePrintInvoice}
      />

      <InvoiceCompanyInfo companyInfo={companyInfo} order={order} />

      <InvoiceItemsTable order={order} />

      <InvoicePaymentInfo invoice={invoice} companyInfo={companyInfo} />

      {invoice?.payment_instructions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notas Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm whitespace-pre-line text-gray-700">
                {invoice.payment_instructions}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvoiceDetails;

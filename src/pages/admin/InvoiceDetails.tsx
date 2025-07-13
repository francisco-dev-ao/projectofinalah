
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useInvoices } from '@/hooks/useInvoices';
import { useInvoiceBucket } from '@/hooks/useInvoiceBucket';
// PDF functionality removed - using print reference instead
import { downloadHelpers } from '@/utils/downloadHelpers';
import AdminInvoiceDetailsHeader from '@/components/invoice/AdminInvoiceDetailsHeader';
import InvoiceCompanyInfo from '@/components/invoice/InvoiceCompanyInfo';
import InvoiceItemsTable from '@/components/invoice/InvoiceItemsTable';
import InvoicePaymentInfo from '@/components/invoice/InvoicePaymentInfo';
import AdminLayout from '@/components/admin/AdminLayout';
import { AlertTriangle } from 'lucide-react';

const AdminInvoiceDetails = () => {
  const { id: invoiceId } = useParams<{ id: string }>();
  
  console.log('AdminInvoiceDetails: Invoice ID from params:', invoiceId);
  
  const [invoice, setInvoice] = useState<any | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const { user } = useAdminAuth();
  const { downloadInvoice, shareInvoice, isSharing } = useInvoices();
  const { isInitializing, isInitialized, initializeInvoiceBucket } = useInvoiceBucket();

  useEffect(() => {
    console.log('AdminInvoiceDetails: useEffect triggered', { 
      invoiceId, 
      user: user?.id
    });
    
    if (!invoiceId) {
      console.error('AdminInvoiceDetails: No invoiceId found in URL params');
      setError('ID da fatura não encontrado na URL');
      setLoading(false);
      return;
    }
    
    if (!isInitialized && !isInitializing) {
      console.log('AdminInvoiceDetails: Initializing invoice bucket');
      initializeInvoiceBucket();
    }
    
    if (user) {
      console.log('AdminInvoiceDetails: Fetching invoice details for ID:', invoiceId);
      fetchInvoiceDetails();
      fetchCompanyInfo();
    } else {
      console.log('AdminInvoiceDetails: No user found, waiting for authentication');
    }
  }, [invoiceId, user, isInitialized, isInitializing]);

  const fetchInvoiceDetails = async () => {
    if (!invoiceId) {
      console.error('AdminInvoiceDetails: No invoiceId provided to fetchInvoiceDetails');
      setError('ID da fatura não fornecido');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('AdminInvoiceDetails: Starting fetch for invoice:', invoiceId);
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders:order_id (
            *,
            order_items(*),
            profiles:user_id(*)
          )
        `)
        .eq('id', invoiceId)
        .single();
      
      console.log('AdminInvoiceDetails: Query result:', { data, error });
      
      if (error) {
        console.error('AdminInvoiceDetails: Error fetching invoice:', error);
        setError(`Erro ao carregar fatura: ${error.message}`);
        toast.error('Não foi possível carregar os detalhes da fatura');
        return;
      }
      
      if (!data) {
        console.error('AdminInvoiceDetails: No data returned for invoice');
        setError('Fatura não encontrada');
        toast.error('Fatura não encontrada');
        return;
      }
      
      console.log('AdminInvoiceDetails: Invoice data loaded:', data);
      
      // Admin can see all invoices, no permission check needed
      setInvoice(data);
      setOrder(data?.orders || null);
      console.log('AdminInvoiceDetails: Invoice and order data set successfully');
    } catch (error: any) {
      console.error('AdminInvoiceDetails: Exception in fetchInvoiceDetails:', error);
      setError(`Erro ao carregar detalhes da fatura: ${error.message}`);
      toast.error(`Erro ao carregar detalhes da fatura`);
    } finally {
      setLoading(false);
      console.log('AdminInvoiceDetails: Fetch completed, loading set to false');
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      console.log('AdminInvoiceDetails: Fetching company info');
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('AdminInvoiceDetails: Error fetching company info:', error);
      }
      
      if (data) {
        console.log('AdminInvoiceDetails: Company info loaded:', data);
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('AdminInvoiceDetails: Exception in fetchCompanyInfo:', error);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoice) return;
    
    try {
      console.log('AdminInvoiceDetails: Starting download for invoice:', invoice.id);
      await downloadInvoice(invoice.id, invoice.invoice_number);
    } catch (error) {
      console.error('AdminInvoiceDetails: Error downloading invoice:', error);
      toast.error('Erro ao baixar fatura');
    }
  };


  const handlePrintInvoice = async () => {
    if (!invoice) return;
    
    try {
      setIsPrinting(true);
      console.log('AdminInvoiceDetails: Printing invoice:', invoice.id);
      await downloadHelpers.printInvoiceDirectly(invoice);
    } catch (error) {
      console.error('AdminInvoiceDetails: Error printing invoice:', error);
      toast.error('Erro ao imprimir fatura');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareInvoice = async () => {
    if (!invoice) return;
    
    try {
      console.log('AdminInvoiceDetails: Sharing invoice:', invoice.id);
      await shareInvoice(invoice.id);
    } catch (error) {
      console.error('AdminInvoiceDetails: Error sharing invoice:', error);
      toast.error('Erro ao compartilhar fatura');
    }
  };

  if (!invoiceId) {
    return (
      <AdminLayout>
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
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Carregando detalhes da fatura...</p>
          <p className="text-sm text-gray-500">ID da fatura: {invoiceId}</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
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
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  if (!invoice || !order) {
    return (
      <AdminLayout>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Fatura não encontrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              A fatura solicitada não existe.
            </p>
            <p className="text-sm text-red-600 mt-2">ID da fatura: {invoiceId}</p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminInvoiceDetailsHeader
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
    </AdminLayout>
  );
};

export default AdminInvoiceDetails;

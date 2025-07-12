
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deleteInvoice } from '@/services/invoice/crudOperations';
import AlertDialogCustom from '@/components/ui/alert-dialog-custom';
import InvoiceHeader from '@/components/admin/invoices/InvoiceHeader';
import InvoiceFilters from '@/components/admin/invoices/InvoiceFilters';
import BulkActions from '@/components/admin/invoices/BulkActions';
import ClientActions from '@/components/admin/invoices/ClientActions';
import InvoiceTableDesktop from '@/components/admin/invoices/InvoiceTableDesktop';
import InvoiceCardsMobile from '@/components/admin/invoices/InvoiceCardsMobile';
import { useInvoiceFilters } from '@/components/admin/invoices/hooks/useInvoiceFilters';
import { getStatusClass, getStatusInPortuguese, getUniqueClients } from '@/components/admin/invoices/utils/invoiceUtils';

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteClientDialog, setShowDeleteClientDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");
  
  useEffect(() => {
    fetchInvoices();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('invoices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchInvoices();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            *,
            profiles:user_id (
              name,
              email,
              company_name
            )
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
      toast.error('Erro ao carregar faturas');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to the invoices
  const filteredInvoices = useInvoiceFilters(invoices, searchQuery, statusFilter, dateFilter);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter(undefined);
  };

  // Handle checkbox selection
  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredInvoices.map(invoice => invoice.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  // Delete selected invoices
  const handleDeleteSelected = async () => {
    if (selectedInvoices.size === 0) return;

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const invoiceId of selectedInvoices) {
      try {
        const result = await deleteInvoice(invoiceId);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        console.error('Error deleting invoice:', error);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} fatura(s) eliminada(s) com sucesso`);
      await fetchInvoices();
      setSelectedInvoices(new Set());
    }

    if (errorCount > 0) {
      toast.error(`Erro ao eliminar ${errorCount} fatura(s)`);
    }

    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  // Delete all invoices for a client
  const handleDeleteClientInvoices = async () => {
    if (!selectedClientId) return;

    setIsDeleting(true);
    
    try {
      // Get all invoices for the client
      const clientInvoices = invoices.filter(invoice => 
        invoice.orders?.user_id === selectedClientId
      );

      let successCount = 0;
      let errorCount = 0;

      for (const invoice of clientInvoices) {
        try {
          const result = await deleteInvoice(invoice.id);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error('Error deleting invoice:', error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} fatura(s) do cliente eliminada(s) com sucesso`);
        await fetchInvoices();
      }

      if (errorCount > 0) {
        toast.error(`Erro ao eliminar ${errorCount} fatura(s)`);
      }

    } catch (error) {
      console.error('Error deleting client invoices:', error);
      toast.error('Erro ao eliminar faturas do cliente');
    }

    setIsDeleting(false);
    setShowDeleteClientDialog(false);
    setSelectedClientId(null);
    setSelectedClientName("");
  };

  const handleClientSelect = (clientId: string, clientName: string) => {
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <InvoiceHeader onRefresh={fetchInvoices} />

        <BulkActions
          selectedCount={selectedInvoices.size}
          onDeleteSelected={() => setShowDeleteDialog(true)}
          onClearSelection={() => setSelectedInvoices(new Set())}
          isDeleting={isDeleting}
        />

        <ClientActions
          clients={getUniqueClients(invoices)}
          selectedClientId={selectedClientId}
          onClientSelect={handleClientSelect}
          onDeleteClientInvoices={() => setShowDeleteClientDialog(true)}
          isDeleting={isDeleting}
        />

        <InvoiceFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          clearFilters={clearFilters}
        />

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center my-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <InvoiceTableDesktop
              invoices={filteredInvoices}
              selectedInvoices={selectedInvoices}
              onSelectInvoice={handleSelectInvoice}
              onSelectAll={handleSelectAll}
              getStatusClass={getStatusClass}
              getStatusInPortuguese={getStatusInPortuguese}
            />

            <InvoiceCardsMobile
              invoices={filteredInvoices}
              selectedInvoices={selectedInvoices}
              onSelectInvoice={handleSelectInvoice}
              getStatusClass={getStatusClass}
              getStatusInPortuguese={getStatusInPortuguese}
            />
          </>
        )}

        {/* Delete Selected Dialog */}
        <AlertDialogCustom
          open={showDeleteDialog}
          title="Confirmar Eliminação"
          description={`Tem certeza que deseja eliminar ${selectedInvoices.size} fatura(s) selecionada(s)? Esta ação não pode ser desfeita.`}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          confirmVariant="destructive"
          onConfirm={handleDeleteSelected}
          onCancel={() => setShowDeleteDialog(false)}
          loading={isDeleting}
        />

        {/* Delete Client Invoices Dialog */}
        <AlertDialogCustom
          open={showDeleteClientDialog}
          title="Confirmar Eliminação de Faturas do Cliente"
          description={`Tem certeza que deseja eliminar TODAS as faturas do cliente "${selectedClientName}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Eliminar Todas"
          cancelLabel="Cancelar"
          confirmVariant="destructive"
          onConfirm={handleDeleteClientInvoices}
          onCancel={() => setShowDeleteClientDialog(false)}
          loading={isDeleting}
        />
      </div>
    </AdminLayout>
  );
}

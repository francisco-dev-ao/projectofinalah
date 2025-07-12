
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Globe, Mail, Server, Receipt } from 'lucide-react';
import OrdersBulkManager from '@/components/admin/bulk-actions/OrdersBulkManager';
import DomainsBulkManager from '@/components/admin/bulk-actions/DomainsBulkManager';

// Import existing invoice components that already have bulk functionality
import InvoiceHeader from '@/components/admin/invoices/InvoiceHeader';
import InvoiceFilters from '@/components/admin/invoices/InvoiceFilters';
import BulkActions from '@/components/admin/invoices/BulkActions';
import ClientActions from '@/components/admin/invoices/ClientActions';
import InvoiceTableDesktop from '@/components/admin/invoices/InvoiceTableDesktop';
import InvoiceCardsMobile from '@/components/admin/invoices/InvoiceCardsMobile';
import { useInvoiceFilters } from '@/components/admin/invoices/hooks/useInvoiceFilters';
import { getStatusClass, getStatusInPortuguese, getUniqueClients } from '@/components/admin/invoices/utils/invoiceUtils';

// Import invoice management logic from the main invoices page
import { supabase } from '@/lib/supabase';
import { deleteInvoice } from '@/services/invoice/crudOperations';
import { toast } from 'react-hot-toast';
import AlertDialogCustom from '@/components/ui/alert-dialog-custom';

export default function BulkManagement() {
  const [activeTab, setActiveTab] = useState("orders");
  
  // Invoice state (copied from invoices page)
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteClientDialog, setShowDeleteClientDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");

  React.useEffect(() => {
    if (activeTab === "invoices") {
      fetchInvoices();
    }
  }, [activeTab]);

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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gerenciamento em Massa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Gerencie e exclua múltiplos itens de uma vez. Selecione a categoria que deseja gerenciar.
            </p>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Faturas</span>
            </TabsTrigger>
            <TabsTrigger value="domains" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Domínios</span>
            </TabsTrigger>
            <TabsTrigger value="hosting" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">Hospedagem</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrdersBulkManager />
          </TabsContent>

          <TabsContent value="invoices">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Gerenciar Faturas em Massa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Selecione e exclua múltiplas faturas ou todas as faturas de um cliente específico.
                  </p>
                </CardContent>
              </Card>

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

              {isLoading ? (
                <div className="flex justify-center my-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          </TabsContent>

          <TabsContent value="domains">
            <DomainsBulkManager />
          </TabsContent>

          <TabsContent value="hosting">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Server className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Gerenciamento de Hospedagem
                  </h3>
                  <p className="text-gray-500">
                    Funcionalidade de exclusão em massa para serviços de hospedagem em desenvolvimento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Gerenciamento de Email
                  </h3>
                  <p className="text-gray-500">
                    Funcionalidade de exclusão em massa para serviços de email em desenvolvimento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

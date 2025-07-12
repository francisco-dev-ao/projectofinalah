
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Download, RefreshCw, FileText, Plus, Search, Calendar, Filter, Trash2 } from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceStatusToggle } from "./InvoiceStatusToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import InvoicePdfGenerator from "./InvoicePdfGenerator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CreateInvoiceDialog from "./CreateInvoiceDialog";
import { deleteInvoice } from "@/services/invoice";

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          orders (
            *,
            profiles:user_id (*)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Erro ao carregar faturas");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to the invoices
  const filteredInvoices = invoices.filter(invoice => {
    // Apply search query filter
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.orders?.profiles?.name && invoice.orders.profiles.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (invoice.orders?.profiles?.email && invoice.orders.profiles.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (invoice.orders?.profiles?.company_name && invoice.orders.profiles.company_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply status filter
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    // Apply date filter
    let matchesDate = true;
    if (dateFilter) {
      const invoiceDate = new Date(invoice.created_at).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      matchesDate = invoiceDate === filterDate;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'issued':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case 'canceled':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };
  
  // Get invoice status in Portuguese
  const getStatusInPortuguese = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'Rascunho',
      issued: 'Emitida',
      paid: 'Paga',
      canceled: 'Cancelada'
    };
    
    return statusMap[status] || status;
  };

  const handleStatusChanged = () => {
    // Refresh invoices list
    fetchInvoices();
  };

  const handlePdfGenerated = (invoiceId: string, pdfUrl: string) => {
    // Update the invoice in the local state with the new PDF URL
    setInvoices(invoices.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, pdf_url: pdfUrl } : invoice
    ));
  };

  const handleCreateInvoiceSuccess = () => {
    fetchInvoices();
    setCreateInvoiceOpen(false);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter(undefined);
  };

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a fatura ${invoiceNumber}? Esta ação não pode ser desfeita.`)) {
      try {
        const result = await deleteInvoice(invoiceId);
        
        if (result.success) {
          toast.success(`Fatura ${invoiceNumber} excluída com sucesso`);
          // Refresh the invoice list
          fetchInvoices();
        } else {
          toast.error(`Erro ao excluir a fatura: ${result.error?.message || 'Erro desconhecido'}`);
        }
      } catch (error: any) {
        toast.error(`Erro ao excluir a fatura: ${error.message || 'Erro desconhecido'}`);
        console.error('Error deleting invoice:', error);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Gerenciamento de Faturas</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchInvoices}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Atualizar
          </Button>
          <Button 
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setCreateInvoiceOpen(true)}
          >
            <Plus className="h-3 w-3" />
            Nova Fatura
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 mb-4 justify-between items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por cliente ou número da fatura..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="issued">Emitida</SelectItem>
                <SelectItem value="paid">Paga</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            {(searchQuery || statusFilter !== "all" || dateFilter) && (
              <Button variant="ghost" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº da Fatura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Marcar como</TableHead>
                <TableHead>PDF</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {invoice.orders?.profiles?.name || invoice.orders?.profiles?.company_name || "Cliente"}
                      {invoice.orders?.profiles?.email && (
                        <div className="text-xs text-muted-foreground">
                          {invoice.orders.profiles.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(invoice.created_at)}</TableCell>
                    <TableCell>
                      {formatPrice(invoice.orders?.total_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusClass(invoice.status)}>
                        {getStatusInPortuguese(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusToggle 
                        invoiceId={invoice.id} 
                        currentStatus={invoice.status} 
                        onStatusChange={handleStatusChanged} 
                      />
                    </TableCell>
                    <TableCell>
                      <InvoicePdfGenerator
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoice_number}
                        pdfUrl={invoice.pdf_url}
                        onSuccess={(pdfUrl) => handlePdfGenerated(invoice.id, pdfUrl)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link to={`/admin/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver</span>
                          </Link>
                        </Button>
                        {invoice.pdf_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a 
                              href={invoice.pdf_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                          onClick={() => handleDeleteInvoice(invoice.id, invoice.invoice_number)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    Nenhuma fatura encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog 
        open={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        onSuccess={handleCreateInvoiceSuccess}
      />
    </Card>
  );
};

export default InvoiceManagement;

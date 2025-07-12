
import { useMemo } from 'react';

interface Invoice {
  id: string;
  invoice_number?: string;
  created_at: string;
  orders?: {
    profiles?: {
      name?: string;
      company_name?: string;
      email?: string;
    };
  };
  status: string;
}

export const useInvoiceFilters = (
  invoices: Invoice[],
  searchQuery: string,
  statusFilter: string,
  dateFilter: Date | undefined
) => {
  return useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (invoice.orders?.profiles?.name && invoice.orders.profiles.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (invoice.orders?.profiles?.email && invoice.orders.profiles.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (invoice.orders?.profiles?.company_name && invoice.orders.profiles.company_name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter) {
        const invoiceDate = new Date(invoice.created_at).toDateString();
        const filterDate = new Date(dateFilter).toDateString();
        matchesDate = invoiceDate === filterDate;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, searchQuery, statusFilter, dateFilter]);
};

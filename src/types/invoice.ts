export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'canceled' | 'pending';

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
  due_date: string;
  pdf_url: string;
  company_details: string;
  payment_instructions: string;
  is_public: boolean;
  public_token: string;
  share_token: string;
  amount?: number;
  client_name?: string;
  client_email?: string;
}

export interface InvoiceItem {
  id?: string;
  invoice_id: string;
  service_name: string;
  service_description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at?: string;
}

export interface InvoiceDetails {
  invoice: Invoice;
  items: InvoiceItem[];
  client?: {
    name: string;
    email: string;
    address?: string;
    phone?: string;
    tax_id?: string;
  };
}

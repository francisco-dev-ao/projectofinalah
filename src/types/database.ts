
// Type definitions for database schema
import { Invoice as BaseInvoice } from '@/types/invoice';
import { Payment } from '@/types/payment';

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  recurring: boolean;
  billing_cycle?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  stock_quantity?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerService {
  id: string;
  user_id: string;
  service_id: string;
  status: string;
  start_date: string;
  next_invoice_date?: string;
  end_date?: string;
  price_at_purchase: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  template_data: any;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceReminder {
  id: string;
  invoice_id: string;
  scheduled_date: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed';
  reminder_type: 'before_due' | 'due' | 'after_due';
  created_at: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Extended types for existing tables with new columns
export interface InvoiceExtended extends BaseInvoice {
  organization_id?: string;
  pdf_generation_attempts?: number;
  last_pdf_generation_error?: string;
}

export interface PaymentExtended extends Payment {
  approved_by?: string;
}

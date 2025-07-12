
import { InvoiceStatus } from '@/types/invoice';

// Define our own enum since we can't import it
export enum InvoiceStatusEnum {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  CANCELED = 'canceled',
  PENDING = 'pending'
}

// Define a proper type for invoice data
export type InvoiceCreateData = {
  invoice_number: string;
  order_id: string;
  user_id?: string;
  created_at?: string;
  due_date?: string;
  total_amount?: number;
  status?: InvoiceStatus;
  payment_method?: string;
  company_details?: string;
  payment_instructions?: string;
  notes?: string;
  pdf_url?: string;
  public_token?: string;
  is_public?: boolean;
  updated_at?: string;
};

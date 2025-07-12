
// Define JSON type locally to avoid dependency on supabase/types
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export enum OrderStatus {
  DRAFT = "draft",
  PENDING = "pending",
  PAID = "paid",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  CANCELED = "canceled",
  PROCESSING = "processing"
}

export enum PaymentMethod {
  BANK_TRANSFER = "bank_transfer",
  MULTICAIXA = "multicaixa",
  EMISCART = "emiscart",
  CREDIT_CARD = "credit_card"
}

export enum PaymentStatus {
  AWAITING = "awaiting",
  PROCESSING = "processing",
  CONFIRMED = "confirmed",
  FAILED = "failed"
}

export interface OrderItem {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  duration?: number | null;
  duration_unit?: 'day' | 'month' | 'year' | null;
  type?: string;
  // Alternative field names used in orderManagementService
  productId?: string;
  productName?: string;
  unitPrice?: number;
  totalPrice?: number;
  productType?: string;
  period?: string;
}

export interface OrderData {
  userId: string;
  items: OrderItem[];
  status?: OrderStatus | string;
  total?: number;
  totalAmount?: number;
  notes?: string;
  cartItems?: any;
  // Client fields
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientNif?: string;
  clientCompany?: string;
  // Add the missing paymentMethod field
  paymentMethod?: PaymentMethod | string;
}

export interface PaymentData {
  orderId: string;
  method: PaymentMethod | string;
  amount: number;
  notes?: string;
  receiptUrl?: string;
  transactionId?: string;
  // Added fields to match what's used in orderManagementService
  status?: PaymentStatus | string;
  paymentMethod?: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount_paid: number;
  method: string;
  status: string;
  transaction_id?: string;
  receipt_url?: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  confirmed_by?: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  rf_tax: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  payment_method?: string;
  cart_items?: Json;
  profiles?: any;
  order_items?: any[];
  invoices?: any[];
  payments?: Payment[];
}

export interface OrdersResult {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  success: boolean;
}

export interface OrderResult {
  order: Order | null;
  success: boolean;
}

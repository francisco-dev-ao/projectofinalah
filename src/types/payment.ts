
export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id?: string;
  payment_date: string;
  created_at: string;
  updated_at: string;
}

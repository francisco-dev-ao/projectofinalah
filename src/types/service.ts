
// Define the allowed service status types explicitly to match what's expected for services
export type ServiceStatus = 'pending' | 'paid' | 'canceled' | 'cancelled' | 'processing' | 'completed' | 'active' | 'suspended' | 'expired';

// TypeScript interface for services
export interface Service {
  id: string;
  user_id: string;
  product_id: string;
  name: string;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
  activation_date?: string;
  end_date?: string; 
  auto_renew: boolean;
  last_renewal_date?: string;
  last_renewal_order_id?: string;
  domain_id?: string;
  order_id?: string;
  order_item_id?: string;
  config?: any;
  start_date?: string;
  profiles?: {
    name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
  };
  order_item?: any;
  domains?: Array<{
    id: string;
    domain_name: string;
    status: string;
  }>;
}

export interface ServiceRenewalOptions {
  serviceId: string;
  duration: number;
  durationUnit: 'day' | 'month' | 'year';
  amount: number;
}

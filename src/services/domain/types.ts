
// Define domain status types explicitly - sync with Supabase enum
export type DomainStatus = 'active' | 'pending' | 'expired' | 'transferred';

export interface Domain {
  id: string;
  domain_name: string;
  tld: string;
  user_id: string;
  status: DomainStatus;
  registration_date?: string;
  expiration_date?: string;
  auth_code?: string;
  auto_renew: boolean;
  is_locked: boolean;
  nameservers?: string[];
  created_at: string;
  updated_at: string;
  order_id?: string;
}

export interface DomainResult {
  domain: Domain | null;
  error: any;
}

export interface DomainsResult {
  domains: Domain[];
  error: any;
}

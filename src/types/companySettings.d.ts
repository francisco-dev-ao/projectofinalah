export interface CompanySettings {
  id?: string;
  created_at?: string;
  updated_at?: string;
  logo_url?: string;
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  company_website?: string;
  company_nif?: string;
  multicaixa_express_config?: {
    frametoken: string;
    callback: string;
    success: string;
    error: string;
  };
  bank_transfer_instructions?: string;
  multicaixa_instructions?: string;
  invoice_prefix?: string;
  invoice_next_number?: number;
  terms_and_conditions?: string;
  bank_details?: {
    bank_name: string;
    account_name: string;
    account_number: string;
    iban: string;
    swift_code?: string;
  };
  email_config?: {
    from_name: string;
    from_email: string;
    smtp_host: string;
    smtp_port: number;
    secure: boolean | string;
    auth: {
      user: string;
      pass: string;
    };
  };
  auto_send_invoices?: boolean;
  default_email_template?: string;
  payment_instructions?: string;
  company_details?: string;
}


-- Add email_config and auto_send_invoices to company_settings table
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS email_config JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_send_invoices BOOLEAN DEFAULT false;

-- Add default email_config if null
UPDATE company_settings
SET email_config = '{"from_name":"AngoHost","from_email":"support@angohost.ao","smtp_host":"mail.angohost.ao","smtp_port":587,"secure":false,"auth":{"user":"support@angohost.ao","pass":"97z2lh;F4_k5"}}'::jsonb
WHERE email_config IS NULL AND id IS NOT NULL;


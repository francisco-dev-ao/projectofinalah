
-- Add bank_details column to company_settings table if it doesn't exist
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT NULL;

-- Update a default bank_details if it's null
UPDATE company_settings
SET bank_details = '{"bank_name":"Atlantico","account_name":"AngoHost","account_number":"123456789","iban":"AO123456789012345678901234"}'::jsonb
WHERE bank_details IS NULL AND id IS NOT NULL;

-- Add company_nif column if it doesn't exist
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS company_nif TEXT DEFAULT '5417111740';

-- Add payment_instructions column if it doesn't exist
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS payment_instructions TEXT DEFAULT NULL;

-- Add company_details column if it doesn't exist
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS company_details TEXT DEFAULT NULL;

-- Add multicaixa_reference_config column to company_settings table
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS multicaixa_reference_config JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN company_settings.multicaixa_reference_config IS 'Configuration for Multicaixa payment references system';

-- Ensure RLS policies allow admin access to this column
-- The existing RLS policies on company_settings should already cover this
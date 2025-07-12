
-- Add default_email_template column to company_settings if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'company_settings' AND column_name = 'default_email_template') THEN
        ALTER TABLE company_settings ADD COLUMN default_email_template TEXT DEFAULT NULL;
    END IF;
END $$;

-- Add auto_send_invoices column to company_settings if it doesn't exist  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'company_settings' AND column_name = 'auto_send_invoices') THEN
        ALTER TABLE company_settings ADD COLUMN auto_send_invoices BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Drop functions if they exist to prevent errors
DROP FUNCTION IF EXISTS check_column_exists;
DROP FUNCTION IF EXISTS add_column_if_not_exists;

-- Add RPC functions to check if a column exists and add column if it doesn't exist
CREATE OR REPLACE FUNCTION check_column_exists(table_name TEXT, column_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = check_column_exists.table_name
        AND column_name = check_column_exists.column_name
    ) INTO column_exists;
    
    RETURN column_exists;
END;
$$;

CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    table_name TEXT,
    column_name TEXT,
    column_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = add_column_if_not_exists.table_name
        AND column_name = add_column_if_not_exists.column_name
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', 
                      table_name, column_name, column_type);
    END IF;
END;
$$;


-- Creates a function to return the count of rows in important tables
-- Useful for data cleanup operations and monitoring
CREATE OR REPLACE FUNCTION get_table_row_counts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  WITH table_counts AS (
    SELECT 'profiles' as table_name, count(*) as row_count FROM profiles
    UNION ALL SELECT 'orders', count(*) FROM orders
    UNION ALL SELECT 'order_items', count(*) FROM order_items
    UNION ALL SELECT 'invoices', count(*) FROM invoices
    UNION ALL SELECT 'payments', count(*) FROM payments
    UNION ALL SELECT 'services', count(*) FROM services
    UNION ALL SELECT 'domains', count(*) FROM domains
    UNION ALL SELECT 'dns_records', count(*) FROM dns_records
    UNION ALL SELECT 'notifications', count(*) FROM notifications
    UNION ALL SELECT 'notification_preferences', count(*) FROM notification_preferences
    UNION ALL SELECT 'products', count(*) FROM products
    UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
  )
  SELECT json_object_agg(table_name, row_count) INTO result FROM table_counts;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_table_row_counts() TO authenticated;

-- Add dns_records table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'dns_records'
    ) THEN
        CREATE TABLE dns_records (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA')),
            name TEXT NOT NULL,
            value TEXT NOT NULL,
            ttl INTEGER NOT NULL DEFAULT 3600,
            priority INTEGER,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Add RLS policies
        ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;
        
        -- Admins can see all records
        CREATE POLICY admin_all_dns_records ON dns_records
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
                )
            );
        
        -- Users can see their own domains' records
        CREATE POLICY user_read_own_dns_records ON dns_records
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM domains
                    WHERE domains.id = dns_records.domain_id AND domains.user_id = auth.uid()
                )
            );
        
        -- Users can edit their own domains' records
        CREATE POLICY user_write_own_dns_records ON dns_records
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM domains
                    WHERE domains.id = dns_records.domain_id AND domains.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Create trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply trigger to dns_records table if it doesn't exist
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'dns_records'
    ) AND NOT EXISTS (
        SELECT FROM pg_trigger
        WHERE tgname = 'set_dns_records_updated_at'
    ) THEN
        CREATE TRIGGER set_dns_records_updated_at
        BEFORE UPDATE ON dns_records
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create a function to generate a new token for invoice sharing
CREATE OR REPLACE FUNCTION generate_new_invoice_token(invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE invoices 
  SET share_token = encode(gen_random_bytes(16), 'hex')
  WHERE id = invoice_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_new_invoice_token(UUID) TO authenticated;

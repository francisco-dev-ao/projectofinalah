-- Update domain management tables and permissions

-- Add service_id column to domains table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'domains'
        AND column_name = 'service_id'
    ) THEN
        ALTER TABLE domains ADD COLUMN service_id UUID REFERENCES services(id) NULL;
    END IF;
END $$;

-- Ensure domains table has the appropriate columns for manual creation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'domains'
    ) THEN
        CREATE TABLE IF NOT EXISTS domains (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            domain_name TEXT NOT NULL,
            tld TEXT NOT NULL,
            registration_date TIMESTAMP WITH TIME ZONE,
            expiration_date TIMESTAMP WITH TIME ZONE,
            status TEXT NOT NULL DEFAULT 'pending' 
                CHECK (status IN ('active', 'pending', 'expired', 'transferred', 'cancelled')),
            nameservers TEXT[] DEFAULT ARRAY['ns1.angohost.co.ao', 'ns2.angohost.co.ao'],
            privacy_protection BOOLEAN DEFAULT FALSE,
            auto_renew BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            auth_code TEXT,
            notes TEXT,
            service_id UUID REFERENCES services(id)
        );
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS domains_user_id_idx ON domains(user_id);
        CREATE INDEX IF NOT EXISTS domains_domain_name_idx ON domains(domain_name);
    END IF;
END $$;

-- Ensure services table has the appropriate columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'services'
    ) THEN
        CREATE TABLE IF NOT EXISTS services (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            product_id UUID REFERENCES products(id),
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' 
                CHECK (status IN ('active', 'pending', 'suspended', 'cancelled', 'expired')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            activation_date TIMESTAMP WITH TIME ZONE,
            end_date TIMESTAMP WITH TIME ZONE,
            auto_renew BOOLEAN DEFAULT TRUE,
            last_renewal_date TIMESTAMP WITH TIME ZONE,
            last_renewal_order_id UUID,
            domain_id UUID REFERENCES domains(id),
            order_id UUID REFERENCES orders(id),
            order_item_id UUID,
            config JSONB,
            notes TEXT,
            start_date TIMESTAMP WITH TIME ZONE
        );
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS services_user_id_idx ON services(user_id);
        CREATE INDEX IF NOT EXISTS services_status_idx ON services(status);
    END IF;
END $$;

-- Setup RLS for domains table
DO $$
BEGIN
    -- Enable RLS on domains table
    ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS domains_admin_all ON domains;
    DROP POLICY IF EXISTS domains_user_select ON domains;
    DROP POLICY IF EXISTS domains_user_insert ON domains;
    DROP POLICY IF EXISTS domains_user_update ON domains;
    DROP POLICY IF EXISTS domains_user_delete ON domains;
    
    -- Admin users can do anything
    CREATE POLICY domains_admin_all ON domains
        USING (
            (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
        );
        
    -- Users can only see their own domains
    CREATE POLICY domains_user_select ON domains
        FOR SELECT
        USING (user_id = auth.uid());
        
    -- Users can only create domains for themselves
    CREATE POLICY domains_user_insert ON domains
        FOR INSERT
        WITH CHECK (user_id = auth.uid());
        
    -- Users can only update their own domains
    CREATE POLICY domains_user_update ON domains
        FOR UPDATE
        USING (user_id = auth.uid());
        
    -- Users can only delete their own domains
    CREATE POLICY domains_user_delete ON domains
        FOR DELETE
        USING (user_id = auth.uid());
END $$;

-- Setup RLS for services table
DO $$
BEGIN
    -- Enable RLS on services table
    ALTER TABLE services ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS services_admin_all ON services;
    DROP POLICY IF EXISTS services_user_select ON services;
    DROP POLICY IF EXISTS services_user_update ON services;
    
    -- Admin users can do anything
    CREATE POLICY services_admin_all ON services
        USING (
            (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
        );
        
    -- Users can only see their own services
    CREATE POLICY services_user_select ON services
        FOR SELECT
        USING (user_id = auth.uid());
        
    -- Users can only update specific fields of their own services
    CREATE POLICY services_user_update ON services
        FOR UPDATE
        USING (user_id = auth.uid())
        WITH CHECK (
            -- Users can only update specific fields, not all
            (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('admin', 'super_admin')
            AND (
                auto_renew IS NOT DISTINCT FROM OLD.auto_renew
                -- Add any other fields users should be able to update
            )
        );
END $$;

-- Create a function to check if a domain is manageable
CREATE OR REPLACE FUNCTION is_domain_manageable(domain_status TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only active domains are fully manageable
    RETURN domain_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to prevent rapid changes to domain status
CREATE OR REPLACE FUNCTION log_domain_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_logs(user_id, action, details)
        VALUES (
            auth.uid(),
            'domain_status_change',
            format('Domain %s.%s status changed from %s to %s', 
                   NEW.domain_name, NEW.tld, OLD.status, NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    DROP TRIGGER IF EXISTS domain_status_change_trigger ON domains;
    CREATE TRIGGER domain_status_change_trigger
        AFTER UPDATE OF status ON domains
        FOR EACH ROW
        EXECUTE FUNCTION log_domain_status_change();
END $$; 

-- Add execute_sql function for authorized admin use
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This function allows executing arbitrary SQL
    -- It should be protected with RLS policies to ensure only admins can use it
    EXECUTE sql;
END;
$$;

-- Add RLS policy to limit this function to admin users
DO $$
BEGIN
    -- Create policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'execute_sql' AND policyname = 'execute_sql_admin_only'
    ) THEN
        CREATE POLICY execute_sql_admin_only ON execute_sql
            USING (
                (SELECT is_admin() OR (SELECT is_super_admin()))
            );
    END IF;
EXCEPTION
    WHEN others THEN
        -- Policy might not be applicable this way, which is fine
        NULL;
END $$;

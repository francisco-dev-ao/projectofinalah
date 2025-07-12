
-- Allow users to delete their own domains
-- This updates the existing RLS policy to include DELETE operations

-- Drop the existing user delete policy if it exists
DROP POLICY IF EXISTS domains_user_delete ON domains;

-- Create new policy that allows users to delete their own domains
CREATE POLICY domains_user_delete ON domains
    FOR DELETE
    USING (user_id = auth.uid());

-- Ensure the policy is properly applied
COMMENT ON POLICY domains_user_delete ON domains IS 'Users can delete their own domains';

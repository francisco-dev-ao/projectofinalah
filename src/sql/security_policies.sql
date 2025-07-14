
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "user_wallets_select_policy" ON user_wallets;
DROP POLICY IF EXISTS "wallet_transactions_select_policy" ON wallet_transactions;
DROP POLICY IF EXISTS "wallet_transfers_select_policy" ON wallet_transfers;

-- User Wallets Security
CREATE POLICY "Users can view own wallet"
  ON user_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users cannot directly modify wallets"
  ON user_wallets FOR ALL
  USING (false);

-- Admin can view all wallets
CREATE POLICY "Admins can manage all wallets"
  ON user_wallets FOR ALL
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
  );

-- Wallet Transactions Security
CREATE POLICY "Users can view own transactions"
  ON wallet_transactions FOR SELECT
  USING (
    (SELECT user_id FROM user_wallets WHERE id = wallet_id) = auth.uid()
  );

CREATE POLICY "Only system can create transactions"
  ON wallet_transactions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Admins can view all transactions"
  ON wallet_transactions FOR SELECT
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
  );

-- Invoices Security
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
    OR 
    auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'suporte')
  );

CREATE POLICY "Only system can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
  );

-- Orders Security
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (
    user_id = auth.uid()
    OR 
    auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'suporte')
  );

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Profiles Security
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
    OR auth.jwt() ->> 'user_metadata' ->> 'role' = 'suporte'
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Payment References Security
CREATE POLICY "Users can view own payment references"
  ON payment_references FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN orders o ON i.order_id = o.id
      WHERE i.id = invoice_id AND o.user_id = auth.uid()
    )
    OR 
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
  );

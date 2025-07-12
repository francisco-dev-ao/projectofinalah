
-- Create contact_profiles table with RLS policies
CREATE TABLE IF NOT EXISTS contact_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_foreigner BOOLEAN DEFAULT FALSE,
  nif TEXT NOT NULL,
  is_individual_company BOOLEAN DEFAULT FALSE,
  domain_owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Angola',
  state TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_profiles_user_id ON contact_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_profiles_nif ON contact_profiles(nif);

-- Enable Row Level Security
ALTER TABLE contact_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own contact profiles" ON contact_profiles;
DROP POLICY IF EXISTS "Users can insert their own contact profiles" ON contact_profiles;
DROP POLICY IF EXISTS "Users can update their own contact profiles" ON contact_profiles;
DROP POLICY IF EXISTS "Users can delete their own contact profiles" ON contact_profiles;
DROP POLICY IF EXISTS "Admins can manage all contact profiles" ON contact_profiles;

-- Create RLS policies
CREATE POLICY "Users can view their own contact profiles" ON contact_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact profiles" ON contact_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact profiles" ON contact_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact profiles" ON contact_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Allow admins to manage all contact profiles
CREATE POLICY "Admins can manage all contact profiles" ON contact_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_profiles_updated_at 
  BEFORE UPDATE ON contact_profiles 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

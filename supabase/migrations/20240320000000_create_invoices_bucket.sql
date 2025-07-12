-- Drop existing bucket if it exists
drop bucket if exists invoices;

-- Create a new storage bucket for invoices
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true);

-- Enable row level security
alter table storage.objects enable row level security;

-- Create a policy to allow authenticated users to read their own invoices
create policy "Users can read their own invoices"
  on storage.objects for select
  using (
    bucket_id = 'invoices' and
    auth.uid() in (
      select o.user_id
      from orders o
      join invoices i on i.order_id = o.id
      where i.id::text = substring(name from '^([^-]+)')
    )
  );

-- Create a policy to allow admins to read all invoices
create policy "Admins can read all invoices"
  on storage.objects for select
  using (
    bucket_id = 'invoices' and
    auth.uid() in (
      select id
      from auth.users
      where raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create a policy to allow the service role to upload invoices
create policy "Service role can upload invoices"
  on storage.objects for insert
  with check (
    bucket_id = 'invoices' and
    auth.role() = 'service_role'
  );

-- Create a policy to allow the service role to update invoices
create policy "Service role can update invoices"
  on storage.objects for update
  using (
    bucket_id = 'invoices' and
    auth.role() = 'service_role'
  )
  with check (
    bucket_id = 'invoices'
  );

-- Create a policy to allow the service role to delete invoices
create policy "Service role can delete invoices"
  on storage.objects for delete
  using (
    bucket_id = 'invoices' and
    auth.role() = 'service_role'
  );

-- Create a policy to allow public access to invoice PDFs
create policy "Public can read invoice PDFs"
  on storage.objects for select
  using (
    bucket_id = 'invoices' and
    storage.extension(name) = 'pdf'
  ); 
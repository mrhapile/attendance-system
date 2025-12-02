-- Create admins table
create table admins (
  id uuid references auth.users not null primary key,
  name text not null,
  email text not null
);

-- Enable Row Level Security (RLS)
alter table admins enable row level security;

-- Create policies
create policy "Admins can view their own data" on admins
  for select using (auth.uid() = id);

-- Allow admins to view all data (optional, depending on needs)
-- For now, just basic RLS.

# Class Path Finder - Supabase Backend Setup

This document provides the SQL commands and configuration needed to set up your Supabase backend.

## 1. Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create routines table
create table routines (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  json_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table routines enable row level security;

-- Create policies
create policy "Users can view own routines"
  on routines for select
  using (true);

create policy "Users can insert own routines"
  on routines for insert
  with check (true);

create policy "Users can update own routines"
  on routines for update
  using (true);

create policy "Users can delete own routines"
  on routines for delete
  using (true);
```

## 2. Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Click "Create a new bucket"
3. Name: `routine_files`
4. Make it **Public** or configure RLS policies as needed

### Storage Policies (if using private bucket):

```sql
-- Policy: Allow users to upload files
create policy "Allow file uploads"
  on storage.objects for insert
  with check (bucket_id = 'routine_files');

-- Policy: Allow users to view files
create policy "Allow file downloads"
  on storage.objects for select
  using (bucket_id = 'routine_files');
```

## 3. Get Your Credentials

1. Go to Settings > API in your Supabase dashboard
2. Copy your **Project URL**
3. Copy your **anon/public key**
4. Update the `.env` file in your project root:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Test Connection

After updating the `.env` file, restart your development server:

```bash
npm run dev
```

The app will now connect to your Supabase backend!

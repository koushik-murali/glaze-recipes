-- Run this script in your Supabase SQL editor to fix firing logs data issues
-- This will ensure the firing_logs table has the correct structure and data

-- First, let's check the current state of the firing_logs table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'firing_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any existing firing logs
SELECT COUNT(*) as total_firing_logs FROM public.firing_logs;

-- Check the structure of existing firing logs
SELECT 
  id,
  user_id,
  kiln_name,
  title,
  date,
  firing_type,
  target_temperature,
  actual_temperature,
  created_at
FROM public.firing_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- Now run the migration
\i supabase/migrations/010_fix_firing_logs_data_issues.sql

-- Verify the migration worked
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'firing_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check firing logs again
SELECT COUNT(*) as total_firing_logs_after_migration FROM public.firing_logs;

-- Test a simple query to make sure data is accessible
SELECT 
  id,
  title,
  kiln_name,
  firing_type,
  target_temperature,
  actual_temperature,
  created_at
FROM public.firing_logs 
ORDER BY created_at DESC 
LIMIT 10;

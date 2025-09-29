-- Quick script to check what's currently in the firing_logs table
-- Run this in your Supabase SQL editor

-- Check total count
SELECT COUNT(*) as total_firing_logs FROM public.firing_logs;

-- Check recent logs
SELECT 
    id,
    user_id,
    kiln_name,
    title,
    date,
    firing_type,
    target_temperature,
    actual_temperature,
    created_at,
    updated_at
FROM public.firing_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check logs by user (replace with your actual user ID)
-- SELECT 
--     id,
--     kiln_name,
--     title,
--     date,
--     firing_type,
--     created_at
-- FROM public.firing_logs 
-- WHERE user_id = 'YOUR_USER_ID_HERE'
-- ORDER BY created_at DESC;

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'firing_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'firing_logs';

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'firing_logs';

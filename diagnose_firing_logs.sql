-- Diagnostic script to check firing logs data and identify issues
-- Run this in your Supabase SQL editor to diagnose problems

-- 1. Check if the firing_logs table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firing_logs' AND table_schema = 'public')
    THEN 'firing_logs table EXISTS'
    ELSE 'firing_logs table DOES NOT EXIST'
  END as table_status;

-- 2. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'firing_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'firing_logs';

-- 4. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'firing_logs';

-- 5. Count total firing logs
SELECT COUNT(*) as total_firing_logs FROM public.firing_logs;

-- 6. Check recent firing logs (last 10)
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

-- 7. Check for any firing logs with missing required fields
SELECT 
  COUNT(*) as logs_with_missing_title,
  COUNT(CASE WHEN temperature_entries IS NULL THEN 1 END) as logs_with_null_temperature_entries,
  COUNT(CASE WHEN warning_flags IS NULL THEN 1 END) as logs_with_null_warning_flags
FROM public.firing_logs;

-- 8. Check temperature_entries structure for recent logs
SELECT 
  id,
  title,
  jsonb_array_length(temperature_entries) as num_temperature_entries,
  temperature_entries
FROM public.firing_logs 
WHERE temperature_entries IS NOT NULL 
  AND temperature_entries != '[]'::jsonb
ORDER BY created_at DESC 
LIMIT 5;

-- 9. Check user permissions (if you're logged in as a specific user)
SELECT 
  auth.uid() as current_user_id,
  COUNT(*) as user_firing_logs
FROM public.firing_logs 
WHERE user_id = auth.uid();

-- 10. Test a simple insert (this will only work if you have proper permissions)
-- Uncomment the following lines to test insertion:
/*
INSERT INTO public.firing_logs (
  user_id,
  kiln_name,
  title,
  date,
  notes,
  firing_type,
  target_temperature,
  actual_temperature,
  firing_duration_hours,
  ramp_rate,
  temperature_entries,
  warning_flags
) VALUES (
  auth.uid(),
  'Test Kiln',
  'Diagnostic Test Firing',
  CURRENT_DATE,
  'This is a diagnostic test',
  'bisque',
  999,
  1000,
  8.0,
  125.0,
  '[]'::jsonb,
  '[]'::jsonb
) RETURNING id, title, created_at;
*/

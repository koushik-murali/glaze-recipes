-- Fix ramp_rate column type to handle decimal values
-- The ramp_rate should be DECIMAL, not INTEGER

-- Check current column type
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'firing_logs' 
  AND column_name = 'ramp_rate'
  AND table_schema = 'public';

-- Drop the view that depends on ramp_rate
DROP VIEW IF EXISTS firing_log_statistics;

-- Change ramp_rate from INTEGER to DECIMAL(10,2)
ALTER TABLE public.firing_logs 
ALTER COLUMN ramp_rate TYPE DECIMAL(10,2);

-- Also ensure firing_duration_hours is DECIMAL
ALTER TABLE public.firing_logs 
ALTER COLUMN firing_duration_hours TYPE DECIMAL(10,2);

-- Update any existing NULL values to 0
UPDATE public.firing_logs 
SET ramp_rate = 0 
WHERE ramp_rate IS NULL;

UPDATE public.firing_logs 
SET firing_duration_hours = 0 
WHERE firing_duration_hours IS NULL;

-- Recreate the view
CREATE VIEW firing_log_statistics AS
SELECT 
  user_id,
  COUNT(*) as total_logs,
  AVG(firing_duration_hours) as avg_duration_hours,
  AVG(actual_temperature) as avg_final_temperature,
  AVG(ramp_rate) as avg_ramp_rate,
  SUM(total_warnings_triggered) as total_warnings,
  COUNT(CASE WHEN warning_flags != '[]'::jsonb THEN 1 END) as logs_with_warnings
FROM public.firing_logs
GROUP BY user_id;

-- Grant permissions on the view
GRANT ALL ON public.firing_log_statistics TO authenticated;
GRANT ALL ON public.firing_log_statistics TO anon;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'firing_logs' 
  AND column_name IN ('ramp_rate', 'firing_duration_hours')
  AND table_schema = 'public';

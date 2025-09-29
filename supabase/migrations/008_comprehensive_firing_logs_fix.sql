-- Comprehensive migration to fix firing logs with all required fields
-- This script ensures all necessary columns and constraints are in place

DO $$
BEGIN
  -- Add title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firing_logs'
    AND column_name = 'title'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs
    ADD COLUMN title TEXT DEFAULT NULL;

    COMMENT ON COLUMN public.firing_logs.title IS 'User-defined title for the firing log (defaults to cone value + date)';
    
    -- Update existing records to have default titles
    UPDATE public.firing_logs 
    SET title = CONCAT('Cone ', 
      CASE 
        WHEN target_temperature BETWEEN 1060 AND 1080 THEN '04'
        WHEN target_temperature BETWEEN 1040 AND 1060 THEN '05'
        WHEN target_temperature BETWEEN 990 AND 1020 THEN '06'
        WHEN target_temperature BETWEEN 950 AND 980 THEN '07'
        WHEN target_temperature BETWEEN 910 AND 940 THEN '08'
        WHEN target_temperature BETWEEN 890 AND 920 THEN '09'
        WHEN target_temperature BETWEEN 880 AND 900 THEN '10'
        ELSE CAST(target_temperature AS TEXT) || '°C'
      END,
      ', ', TO_CHAR(date::date, 'Mon DD, YYYY')
    )
    WHERE title IS NULL;
  END IF;

  -- Add temperature_entries column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firing_logs'
    AND column_name = 'temperature_entries'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs
    ADD COLUMN temperature_entries JSONB DEFAULT NULL;

    COMMENT ON COLUMN public.firing_logs.temperature_entries IS 'JSON array of temperature entries with id, time, temperature, notes, atmosphere, and rampRate';
  END IF;

  -- Add warning_flags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firing_logs'
    AND column_name = 'warning_flags'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs
    ADD COLUMN warning_flags JSONB DEFAULT '[]'::jsonb;

    COMMENT ON COLUMN public.firing_logs.warning_flags IS 'JSON array of warning messages triggered during firing';
  END IF;

  -- Add share_token column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firing_logs'
    AND column_name = 'share_token'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs
    ADD COLUMN share_token UUID DEFAULT NULL;

    COMMENT ON COLUMN public.firing_logs.share_token IS 'Unique token for public sharing of firing logs';
  END IF;

  -- Add statistics columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firing_logs'
    AND column_name = 'max_temperature_reached'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs
    ADD COLUMN max_temperature_reached INTEGER DEFAULT NULL;

    COMMENT ON COLUMN public.firing_logs.max_temperature_reached IS 'Maximum temperature reached during firing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firing_logs'
    AND column_name = 'average_ramp_rate'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs
    ADD COLUMN average_ramp_rate DECIMAL(10,2) DEFAULT NULL;

    COMMENT ON COLUMN public.firing_logs.average_ramp_rate IS 'Average ramp rate during firing in degrees per hour';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firing_logs'
    AND column_name = 'total_warnings_triggered'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs
    ADD COLUMN total_warnings_triggered INTEGER DEFAULT 0;

    COMMENT ON COLUMN public.firing_logs.total_warnings_triggered IS 'Total number of warnings triggered during firing';
  END IF;
END $$;

-- Create unique index on share_token if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_firing_logs_share_token'
  ) THEN
    CREATE UNIQUE INDEX idx_firing_logs_share_token ON public.firing_logs(share_token) WHERE share_token IS NOT NULL;
  END IF;
END $$;

-- Create GIN index on temperature_entries if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_firing_logs_temperature_entries'
  ) THEN
    CREATE INDEX idx_firing_logs_temperature_entries ON public.firing_logs USING GIN (temperature_entries);
  END IF;
END $$;

-- Create GIN index on warning_flags if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_firing_logs_warning_flags'
  ) THEN
    CREATE INDEX idx_firing_logs_warning_flags ON public.firing_logs USING GIN (warning_flags);
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.firing_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view their own firing logs" ON public.firing_logs;
  DROP POLICY IF EXISTS "Users can insert their own firing logs" ON public.firing_logs;
  DROP POLICY IF EXISTS "Users can update their own firing logs" ON public.firing_logs;
  DROP POLICY IF EXISTS "Users can delete their own firing logs" ON public.firing_logs;
  DROP POLICY IF EXISTS "Public can view shared firing logs" ON public.firing_logs;
  
  -- Create comprehensive RLS policies
  CREATE POLICY "Users can view their own firing logs" ON public.firing_logs
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own firing logs" ON public.firing_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own firing logs" ON public.firing_logs
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own firing logs" ON public.firing_logs
    FOR DELETE USING (auth.uid() = user_id);

  CREATE POLICY "Public can view shared firing logs" ON public.firing_logs
    FOR SELECT USING (share_token IS NOT NULL);
END $$;

-- Create or replace function to update firing log statistics
CREATE OR REPLACE FUNCTION update_firing_log_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update max temperature reached
  NEW.max_temperature_reached := (
    SELECT MAX((value->>'temperature')::INTEGER)
    FROM jsonb_array_elements(NEW.temperature_entries)
    WHERE value->>'temperature' IS NOT NULL
  );

  -- Update average ramp rate
  NEW.average_ramp_rate := (
    SELECT AVG((value->>'rampRate')::DECIMAL)
    FROM jsonb_array_elements(NEW.temperature_entries)
    WHERE value->>'rampRate' IS NOT NULL
  );

  -- Update total warnings triggered
  NEW.total_warnings_triggered := (
    SELECT jsonb_array_length(NEW.warning_flags)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for updating statistics
DROP TRIGGER IF EXISTS trigger_update_firing_log_stats ON public.firing_logs;
CREATE TRIGGER trigger_update_firing_log_stats
  BEFORE UPDATE ON public.firing_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_firing_log_stats();

-- Update existing firing logs to have proper warning_flags structure
UPDATE public.firing_logs 
SET warning_flags = '[]'::jsonb 
WHERE warning_flags IS NULL;

-- Update existing firing logs to have proper temperature_entries structure with atmosphere
UPDATE public.firing_logs 
SET temperature_entries = (
  SELECT jsonb_agg(
    jsonb_set(
      jsonb_set(
        value,
        '{atmosphere}',
        '"oxidation"'::jsonb
      ),
      '{rampRate}',
      COALESCE(value->'rampRate', 'null'::jsonb)
    )
  )
  FROM jsonb_array_elements(temperature_entries)
)
WHERE temperature_entries IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(temperature_entries)
  WHERE value ? 'atmosphere'
);

-- Add comments to table
COMMENT ON TABLE public.firing_logs IS 'Stores detailed firing logs with temperature tracking, warnings, and sharing capabilities';
COMMENT ON COLUMN public.firing_logs.temperature_entries IS 'JSON array of temperature entries with id, time, temperature, notes, atmosphere (oxidation/reduction), and rampRate';
COMMENT ON COLUMN public.firing_logs.warning_flags IS 'JSON array of warning objects with message and severity fields';
COMMENT ON COLUMN public.firing_logs.share_token IS 'UUID token for public sharing - when present, allows anonymous access to the firing log';

-- Create or replace view for firing log statistics (optional)
DROP VIEW IF EXISTS firing_log_statistics;
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

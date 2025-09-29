-- Migration to fix firing logs data issues and ensure proper data structure
-- This script addresses potential issues with firing logs not appearing in the list

DO $$
BEGIN
  -- First, let's check if the firing_logs table exists and has the correct structure
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firing_logs' AND table_schema = 'public') THEN
    -- Create the firing_logs table if it doesn't exist
    CREATE TABLE public.firing_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      kiln_name TEXT NOT NULL,
      title TEXT,
      date DATE NOT NULL,
      notes TEXT,
      firing_type TEXT NOT NULL,
      target_temperature INTEGER NOT NULL,
      actual_temperature INTEGER NOT NULL,
      firing_duration_hours DECIMAL(10,2) DEFAULT 0,
      ramp_rate DECIMAL(10,2) DEFAULT 0,
      temperature_entries JSONB DEFAULT '[]'::jsonb,
      warning_flags JSONB DEFAULT '[]'::jsonb,
      share_token UUID DEFAULT NULL,
      max_temperature_reached INTEGER DEFAULT NULL,
      average_ramp_rate DECIMAL(10,2) DEFAULT NULL,
      total_warnings_triggered INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;

  -- Ensure all required columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'title' AND table_schema = 'public') THEN
    ALTER TABLE public.firing_logs ADD COLUMN title TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'temperature_entries' AND table_schema = 'public') THEN
    ALTER TABLE public.firing_logs ADD COLUMN temperature_entries JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'warning_flags' AND table_schema = 'public') THEN
    ALTER TABLE public.firing_logs ADD COLUMN warning_flags JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'share_token' AND table_schema = 'public') THEN
    ALTER TABLE public.firing_logs ADD COLUMN share_token UUID DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'created_at' AND table_schema = 'public') THEN
    ALTER TABLE public.firing_logs ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'updated_at' AND table_schema = 'public') THEN
    ALTER TABLE public.firing_logs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add statistics columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'max_temperature_reached' AND table_schema = 'public') THEN
    ALTER TABLE public.firing_logs ADD COLUMN max_temperature_reached INTEGER DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'average_ramp_rate' AND table_schema = 'public') THEN
    ALTER TABLE public.firing_logs ADD COLUMN average_ramp_rate DECIMAL(10,2) DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'total_warnings_triggered' AND table_schema = 'public') THEN
    ALTER TABLE public.firing_logs ADD COLUMN total_warnings_triggered INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_firing_logs_user_id ON public.firing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_firing_logs_date ON public.firing_logs(date);
CREATE INDEX IF NOT EXISTS idx_firing_logs_firing_type ON public.firing_logs(firing_type);
CREATE INDEX IF NOT EXISTS idx_firing_logs_title ON public.firing_logs(title);
CREATE INDEX IF NOT EXISTS idx_firing_logs_created_at ON public.firing_logs(created_at);

-- Create unique index on share_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_firing_logs_share_token 
ON public.firing_logs(share_token) 
WHERE share_token IS NOT NULL;

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_firing_logs_temperature_entries_gin 
ON public.firing_logs USING GIN(temperature_entries);

CREATE INDEX IF NOT EXISTS idx_firing_logs_warning_flags_gin 
ON public.firing_logs USING GIN(warning_flags);

-- Enable RLS
ALTER TABLE public.firing_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view their own firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can view shared firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can insert their own firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can update their own firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can delete their own firing logs" ON public.firing_logs;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own firing logs" ON public.firing_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared firing logs" ON public.firing_logs
    FOR SELECT USING (share_token IS NOT NULL);

CREATE POLICY "Users can insert their own firing logs" ON public.firing_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own firing logs" ON public.firing_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own firing logs" ON public.firing_logs
    FOR DELETE USING (auth.uid() = user_id);

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

  -- Update updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for updating statistics
DROP TRIGGER IF EXISTS trigger_update_firing_log_stats ON public.firing_logs;
CREATE TRIGGER trigger_update_firing_log_stats
    BEFORE INSERT OR UPDATE ON public.firing_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_firing_log_stats();

-- Update existing firing logs to have proper structure
UPDATE public.firing_logs 
SET 
  temperature_entries = COALESCE(temperature_entries, '[]'::jsonb),
  warning_flags = COALESCE(warning_flags, '[]'::jsonb),
  title = COALESCE(title, 
    CONCAT('Cone ', 
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
      ' ', 
      COALESCE(
        CASE firing_type
          WHEN 'bisque' THEN 'Bisque Firing'
          WHEN 'glaze' THEN 'Glaze Firing'
          WHEN 'raku' THEN 'Raku Firing'
          WHEN 'wood' THEN 'Wood Firing'
          WHEN 'soda' THEN 'Soda Firing'
          WHEN 'other' THEN 'Other'
          ELSE INITCAP(firing_type)
        END,
        'Firing'
      ),
      ', ', TO_CHAR(date::date, 'Mon DD, YYYY')
    )
  )
WHERE temperature_entries IS NULL 
   OR warning_flags IS NULL 
   OR title IS NULL;

-- Ensure temperature_entries have proper structure with atmosphere
UPDATE public.firing_logs 
SET temperature_entries = (
  SELECT jsonb_agg(
    jsonb_set(
      jsonb_set(
        value,
        '{atmosphere}',
        COALESCE(value->'atmosphere', '"oxidation"'::jsonb)
      ),
      '{rampRate}',
      COALESCE(value->'rampRate', 'null'::jsonb)
    )
  )
  FROM jsonb_array_elements(temperature_entries) AS value
)
WHERE temperature_entries IS NOT NULL 
  AND temperature_entries != '[]'::jsonb
  AND NOT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(temperature_entries) AS value
    WHERE value ? 'atmosphere'
  );

-- Create or replace view for firing log statistics
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

-- Add comprehensive comments
COMMENT ON TABLE public.firing_logs IS 'Stores detailed firing logs with temperature tracking, warnings, and sharing capabilities';
COMMENT ON COLUMN public.firing_logs.user_id IS 'Reference to the user who created this firing log';
COMMENT ON COLUMN public.firing_logs.kiln_name IS 'Name of the kiln used for firing';
COMMENT ON COLUMN public.firing_logs.title IS 'User-defined title for the firing log (defaults to cone value + firing type + date)';
COMMENT ON COLUMN public.firing_logs.date IS 'Date of the firing';
COMMENT ON COLUMN public.firing_logs.notes IS 'Additional notes about the firing';
COMMENT ON COLUMN public.firing_logs.firing_type IS 'Type of firing (bisque, glaze, raku, wood, soda, other)';
COMMENT ON COLUMN public.firing_logs.target_temperature IS 'Target temperature in Celsius';
COMMENT ON COLUMN public.firing_logs.actual_temperature IS 'Final temperature reached in Celsius';
COMMENT ON COLUMN public.firing_logs.firing_duration_hours IS 'Total duration of firing in hours';
COMMENT ON COLUMN public.firing_logs.ramp_rate IS 'Average ramp rate in degrees per hour';
COMMENT ON COLUMN public.firing_logs.temperature_entries IS 'JSON array of temperature entries with id, time, temperature, notes, atmosphere (oxidation/reduction), and rampRate';
COMMENT ON COLUMN public.firing_logs.warning_flags IS 'JSON array of warning objects with message and severity fields';
COMMENT ON COLUMN public.firing_logs.share_token IS 'UUID token for public sharing - when present, allows anonymous access to the firing log';
COMMENT ON COLUMN public.firing_logs.max_temperature_reached IS 'Maximum temperature reached during firing (calculated from temperature_entries)';
COMMENT ON COLUMN public.firing_logs.average_ramp_rate IS 'Average ramp rate in degrees per hour (calculated from temperature_entries)';
COMMENT ON COLUMN public.firing_logs.total_warnings_triggered IS 'Total number of warnings triggered during firing';
COMMENT ON COLUMN public.firing_logs.created_at IS 'Timestamp when the firing log was created';
COMMENT ON COLUMN public.firing_logs.updated_at IS 'Timestamp when the firing log was last updated';

-- Grant necessary permissions
GRANT ALL ON public.firing_logs TO authenticated;
GRANT ALL ON public.firing_logs TO anon;
GRANT ALL ON public.firing_log_statistics TO authenticated;
GRANT ALL ON public.firing_log_statistics TO anon;

-- Create a function to test data insertion
CREATE OR REPLACE FUNCTION test_firing_log_insert()
RETURNS TEXT AS $$
DECLARE
  test_user_id UUID;
  test_log_id UUID;
BEGIN
  -- Get a test user ID (first user in the system)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RETURN 'No users found in the system';
  END IF;

  -- Insert a test firing log
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
    test_user_id,
    'Test Kiln',
    'Test Firing Log',
    CURRENT_DATE,
    'This is a test firing log',
    'bisque',
    999,
    1000,
    8.5,
    120.0,
    '[
      {
        "id": "test-entry-1",
        "time": "10:00",
        "temperature": 200,
        "notes": "Starting temperature",
        "atmosphere": "oxidation",
        "rampRate": null
      },
      {
        "id": "test-entry-2", 
        "time": "12:00",
        "temperature": 500,
        "notes": "Mid-firing",
        "atmosphere": "oxidation",
        "rampRate": 150.0
      },
      {
        "id": "test-entry-3",
        "time": "14:00",
        "temperature": 1000,
        "notes": "Final temperature",
        "atmosphere": "reduction",
        "rampRate": 250.0
      }
    ]'::jsonb,
    '[
      {
        "message": "High ramp rate detected",
        "severity": "warning"
      }
    ]'::jsonb
  ) RETURNING id INTO test_log_id;

  -- Clean up the test data
  DELETE FROM public.firing_logs WHERE id = test_log_id;

  RETURN 'Test firing log insertion successful';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Test failed: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Run the test function
SELECT test_firing_log_insert();

-- Drop the test function
DROP FUNCTION test_firing_log_insert();

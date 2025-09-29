-- Enhanced firing logs with improved temperature tracking and sharing
-- This script adds comprehensive features for temperature entries, warnings, and sharing

DO $$ 
BEGIN 
  -- Add share_token column to firing_logs table (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'firing_logs' 
    AND column_name = 'share_token'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs 
    ADD COLUMN share_token UUID DEFAULT NULL;
    
    COMMENT ON COLUMN public.firing_logs.share_token IS 'Unique token for public sharing of firing logs';
    
    -- Create unique index on share_token
    CREATE UNIQUE INDEX IF NOT EXISTS idx_firing_logs_share_token ON public.firing_logs(share_token);
  END IF;

  -- Add share_token column to glaze_recipes table (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'glaze_recipes' 
    AND column_name = 'share_token'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.glaze_recipes 
    ADD COLUMN share_token UUID DEFAULT NULL;
    
    COMMENT ON COLUMN public.glaze_recipes.share_token IS 'Unique token for public sharing of glaze recipes';
    
    -- Create unique index on share_token
    CREATE UNIQUE INDEX IF NOT EXISTS idx_glaze_recipes_share_token ON public.glaze_recipes(share_token);
  END IF;

  -- Add temperature_entries column to firing_logs table (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'firing_logs' 
    AND column_name = 'temperature_entries'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs 
    ADD COLUMN temperature_entries JSONB DEFAULT NULL;
    
    COMMENT ON COLUMN public.firing_logs.temperature_entries IS 'JSON array of temperature entries with id, time, temperature, notes, and ramp_rate';
  END IF;

  -- Add warning_flags column to firing_logs table (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'firing_logs' 
    AND column_name = 'warning_flags'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs 
    ADD COLUMN warning_flags JSONB DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN public.firing_logs.warning_flags IS 'JSON array of warning objects with type, message, severity, and triggered_at';
  END IF;

  -- Add enhanced columns for better tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'firing_logs' 
    AND column_name = 'max_temperature_reached'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs 
    ADD COLUMN max_temperature_reached INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.firing_logs.max_temperature_reached IS 'Maximum temperature reached during firing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'firing_logs' 
    AND column_name = 'average_ramp_rate'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs 
    ADD COLUMN average_ramp_rate DECIMAL(10,2) DEFAULT 0;
    
    COMMENT ON COLUMN public.firing_logs.average_ramp_rate IS 'Average ramp rate throughout the firing process';
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

-- Create or update RLS policies for enhanced security

-- Enable RLS on firing_logs (if not already enabled)
ALTER TABLE public.firing_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Public access to shared firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can update their own firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can insert their own firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can select their own firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can delete their own firing logs" ON public.firing_logs;

-- Create comprehensive policies for firing_logs
CREATE POLICY "Public access to shared firing logs" ON public.firing_logs
  FOR SELECT 
  USING (share_token IS NOT NULL);

CREATE POLICY "Users can update their own firing logs" ON public.firing_logs
  FOR UPDATE 
  USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own firing logs" ON public.firing_logs
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can select their own firing logs" ON public.firing_logs
  FOR SELECT 
  USING (auth.uid() = user_id::uuid OR share_token IS NOT NULL);

CREATE POLICY "Users can delete their own firing logs" ON public.firing_logs
  FOR DELETE 
  USING (auth.uid() = user_id::uuid);

-- Enable RLS on glaze_recipes (if not already enabled)
ALTER TABLE public.glaze_recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them for glaze_recipes
DROP POLICY IF EXISTS "Public access to shared glaze recipes" ON public.glaze_recipes;
DROP POLICY IF EXISTS "Users can update their own glaze recipes" ON public.glaze_recipes;
DROP POLICY IF EXISTS "Users can insert their own glaze recipes" ON public.glaze_recipes;
DROP POLICY IF EXISTS "Users can select their own glaze recipes" ON public.glaze_recipes;
DROP POLICY IF EXISTS "Users can delete their own glaze recipes" ON public.glaze_recipes;

-- Create comprehensive policies for glaze_recipes
CREATE POLICY "Public access to shared glaze recipes" ON public.glaze_recipes
  FOR SELECT 
  USING (share_token IS NOT NULL);

CREATE POLICY "Users can update their own glaze recipes" ON public.glaze_recipes
  FOR UPDATE 
  USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own glaze recipes" ON public.glaze_recipes
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can select their own glaze recipes" ON public.glaze_recipes
  FOR SELECT 
  USING (auth.uid() = user_id::uuid OR share_token IS NOT NULL);

CREATE POLICY "Users can delete their own glaze recipes" ON public.glaze_recipes
  FOR DELETE 
  USING (auth.uid() = user_id::uuid);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_firing_logs_user_id ON public.firing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_firing_logs_date ON public.firing_logs(date);
CREATE INDEX IF NOT EXISTS idx_firing_logs_firing_type ON public.firing_logs(firing_type);
CREATE INDEX IF NOT EXISTS idx_firing_logs_temperature_entries ON public.firing_logs USING GIN(temperature_entries);
CREATE INDEX IF NOT EXISTS idx_firing_logs_warning_flags ON public.firing_logs USING GIN(warning_flags);

CREATE INDEX IF NOT EXISTS idx_glaze_recipes_user_id ON public.glaze_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_glaze_recipes_date ON public.glaze_recipes(date);
CREATE INDEX IF NOT EXISTS idx_glaze_recipes_finish ON public.glaze_recipes(finish);

-- Create a function to update firing log statistics
CREATE OR REPLACE FUNCTION update_firing_log_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update max temperature reached
  IF NEW.temperature_entries IS NOT NULL AND jsonb_array_length(NEW.temperature_entries) > 0 THEN
    SELECT MAX((entry->>'temperature')::integer)
    INTO NEW.max_temperature_reached
    FROM jsonb_array_elements(NEW.temperature_entries) AS entry;
  END IF;

  -- Update average ramp rate
  IF NEW.temperature_entries IS NOT NULL AND jsonb_array_length(NEW.temperature_entries) > 1 THEN
    SELECT AVG((entry->>'rampRate')::decimal)
    INTO NEW.average_ramp_rate
    FROM jsonb_array_elements(NEW.temperature_entries) AS entry
    WHERE entry->>'rampRate' IS NOT NULL;
  END IF;

  -- Update warning count
  IF NEW.warning_flags IS NOT NULL THEN
    NEW.total_warnings_triggered := jsonb_array_length(NEW.warning_flags);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update statistics
DROP TRIGGER IF EXISTS trigger_update_firing_log_stats ON public.firing_logs;
CREATE TRIGGER trigger_update_firing_log_stats
  BEFORE UPDATE ON public.firing_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_firing_log_stats();

-- Add helpful comments
COMMENT ON TABLE public.firing_logs IS 'Comprehensive firing logs with temperature tracking, warnings, and sharing capabilities';
COMMENT ON TABLE public.glaze_recipes IS 'Glaze recipes with composition, photos, and sharing capabilities';

-- Create a view for firing log statistics (optional)
CREATE OR REPLACE VIEW firing_log_statistics AS
SELECT 
  user_id,
  COUNT(*) as total_firings,
  AVG(firing_duration_hours) as avg_duration_hours,
  MAX(max_temperature_reached) as highest_temperature,
  AVG(average_ramp_rate) as avg_ramp_rate,
  SUM(total_warnings_triggered) as total_warnings,
  COUNT(CASE WHEN share_token IS NOT NULL THEN 1 END) as shared_logs_count
FROM public.firing_logs
GROUP BY user_id;

COMMENT ON VIEW firing_log_statistics IS 'Aggregated statistics for firing logs per user';

-- Add temperature_entries column to firing_logs table
-- This column will store JSON array of temperature entries with time, temperature, and notes

DO $$ 
BEGIN 
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'firing_logs' 
    AND column_name = 'temperature_entries'
    AND table_schema = 'public'
  ) THEN
    -- Add the temperature_entries column
    ALTER TABLE public.firing_logs 
    ADD COLUMN temperature_entries JSONB DEFAULT NULL;
    
    -- Add a comment to describe the column
    COMMENT ON COLUMN public.firing_logs.temperature_entries IS 'JSON array of temperature entries with id, time, temperature, and optional notes';
  END IF;
END $$;

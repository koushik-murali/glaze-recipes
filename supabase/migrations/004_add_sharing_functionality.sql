-- Add sharing functionality to both firing_logs and glaze_recipes tables
-- This includes share_token columns and public access policies

DO $$ 
BEGIN 
  -- Add share_token column to firing_logs table
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

  -- Add share_token column to glaze_recipes table
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

  -- Add temperature_entries column to firing_logs table (if not already exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'firing_logs' 
    AND column_name = 'temperature_entries'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.firing_logs 
    ADD COLUMN temperature_entries JSONB DEFAULT NULL;
    
    COMMENT ON COLUMN public.firing_logs.temperature_entries IS 'JSON array of temperature entries with id, time, temperature, and optional notes';
  END IF;
END $$;

-- Create RLS policies for public access to shared content

-- Enable RLS on firing_logs (if not already enabled)
ALTER TABLE public.firing_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to shared firing logs
DROP POLICY IF EXISTS "Public access to shared firing logs" ON public.firing_logs;
CREATE POLICY "Public access to shared firing logs" ON public.firing_logs
  FOR SELECT 
  USING (share_token IS NOT NULL);

-- Enable RLS on glaze_recipes (if not already enabled)
ALTER TABLE public.glaze_recipes ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to shared glaze recipes
DROP POLICY IF EXISTS "Public access to shared glaze recipes" ON public.glaze_recipes;
CREATE POLICY "Public access to shared glaze recipes" ON public.glaze_recipes
  FOR SELECT 
  USING (share_token IS NOT NULL);

-- Create policies for authenticated users to manage their own shared content

-- Policy for users to update their own firing logs (including share_token)
DROP POLICY IF EXISTS "Users can update their own firing logs" ON public.firing_logs;
CREATE POLICY "Users can update their own firing logs" ON public.firing_logs
  FOR UPDATE 
  USING (auth.uid() = user_id::uuid);

-- Policy for users to update their own glaze recipes (including share_token)
DROP POLICY IF EXISTS "Users can update their own glaze recipes" ON public.glaze_recipes;
CREATE POLICY "Users can update their own glaze recipes" ON public.glaze_recipes
  FOR UPDATE 
  USING (auth.uid() = user_id::uuid);

-- Policy for users to insert their own firing logs
DROP POLICY IF EXISTS "Users can insert their own firing logs" ON public.firing_logs;
CREATE POLICY "Users can insert their own firing logs" ON public.firing_logs
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id::uuid);

-- Policy for users to insert their own glaze recipes
DROP POLICY IF EXISTS "Users can insert their own glaze recipes" ON public.glaze_recipes;
CREATE POLICY "Users can insert their own glaze recipes" ON public.glaze_recipes
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id::uuid);

-- Policy for users to select their own firing logs
DROP POLICY IF EXISTS "Users can select their own firing logs" ON public.firing_logs;
CREATE POLICY "Users can select their own firing logs" ON public.firing_logs
  FOR SELECT 
  USING (auth.uid() = user_id::uuid OR share_token IS NOT NULL);

-- Policy for users to select their own glaze recipes
DROP POLICY IF EXISTS "Users can select their own glaze recipes" ON public.glaze_recipes;
CREATE POLICY "Users can select their own glaze recipes" ON public.glaze_recipes
  FOR SELECT 
  USING (auth.uid() = user_id::uuid OR share_token IS NOT NULL);

-- Policy for users to delete their own firing logs
DROP POLICY IF EXISTS "Users can delete their own firing logs" ON public.firing_logs;
CREATE POLICY "Users can delete their own firing logs" ON public.firing_logs
  FOR DELETE 
  USING (auth.uid() = user_id::uuid);

-- Policy for users to delete their own glaze recipes
DROP POLICY IF EXISTS "Users can delete their own glaze recipes" ON public.glaze_recipes;
CREATE POLICY "Users can delete their own glaze recipes" ON public.glaze_recipes
  FOR DELETE 
  USING (auth.uid() = user_id::uuid);

-- Simplified migration to fix firing logs saving issues
-- This focuses specifically on ensuring data can be saved properly

-- First, let's check the current state
DO $$
DECLARE
    table_exists boolean;
    column_count integer;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'firing_logs'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Count columns
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'firing_logs';
        
        RAISE NOTICE 'firing_logs table exists with % columns', column_count;
    ELSE
        RAISE NOTICE 'firing_logs table does not exist';
    END IF;
END $$;

-- Ensure the table has all required columns with proper types
CREATE TABLE IF NOT EXISTS public.firing_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
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

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add title column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'title') THEN
        ALTER TABLE public.firing_logs ADD COLUMN title TEXT;
    END IF;
    
    -- Add temperature_entries column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'temperature_entries') THEN
        ALTER TABLE public.firing_logs ADD COLUMN temperature_entries JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add warning_flags column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'warning_flags') THEN
        ALTER TABLE public.firing_logs ADD COLUMN warning_flags JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add share_token column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'share_token') THEN
        ALTER TABLE public.firing_logs ADD COLUMN share_token UUID DEFAULT NULL;
    END IF;
    
    -- Add created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'created_at') THEN
        ALTER TABLE public.firing_logs ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'updated_at') THEN
        ALTER TABLE public.firing_logs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add statistics columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'max_temperature_reached') THEN
        ALTER TABLE public.firing_logs ADD COLUMN max_temperature_reached INTEGER DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'average_ramp_rate') THEN
        ALTER TABLE public.firing_logs ADD COLUMN average_ramp_rate DECIMAL(10,2) DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'firing_logs' AND column_name = 'total_warnings_triggered') THEN
        ALTER TABLE public.firing_logs ADD COLUMN total_warnings_triggered INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_firing_logs_user_id ON public.firing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_firing_logs_date ON public.firing_logs(date);
CREATE INDEX IF NOT EXISTS idx_firing_logs_created_at ON public.firing_logs(created_at);

-- Enable RLS
ALTER TABLE public.firing_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "Users can view their own firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can view shared firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can insert their own firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can update their own firing logs" ON public.firing_logs;
DROP POLICY IF EXISTS "Users can delete their own firing logs" ON public.firing_logs;

-- Create RLS policies
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

-- Test the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'firing_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test a simple insert (this will only work if you're authenticated)
-- Uncomment the following lines to test:
/*
DO $$
DECLARE
    test_user_id UUID;
    test_log_id UUID;
BEGIN
    -- Get the first user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Insert a test record
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
            'This is a test',
            'bisque',
            999,
            1000,
            1.0,
            100.0,
            '[]'::jsonb,
            '[]'::jsonb
        ) RETURNING id INTO test_log_id;
        
        RAISE NOTICE 'Test record inserted with ID: %', test_log_id;
        
        -- Clean up
        DELETE FROM public.firing_logs WHERE id = test_log_id;
        RAISE NOTICE 'Test record cleaned up';
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
END $$;
*/

-- Show current firing logs count
SELECT COUNT(*) as total_firing_logs FROM public.firing_logs;

-- Show recent firing logs
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
LIMIT 10;

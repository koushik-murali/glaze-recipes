-- Create active_firing_sessions table for storing live firing sessions
CREATE TABLE IF NOT EXISTS public.active_firing_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kiln_name TEXT NOT NULL,
    firing_type TEXT NOT NULL CHECK (firing_type IN ('bisque', 'glaze', 'raku', 'wood', 'soda', 'other')),
    target_temperature INTEGER NOT NULL,
    target_cone TEXT,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_paused BOOLEAN NOT NULL DEFAULT false,
    current_temperature INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    interval_minutes INTEGER NOT NULL DEFAULT 30,
    temperature_entries JSONB DEFAULT '[]'::jsonb,
    warning_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_active_firing_sessions_user_id ON public.active_firing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_firing_sessions_active ON public.active_firing_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_active_firing_sessions_last_update ON public.active_firing_sessions(last_update);

-- Enable RLS
ALTER TABLE public.active_firing_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own active firing sessions" ON public.active_firing_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own active firing sessions" ON public.active_firing_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active firing sessions" ON public.active_firing_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own active firing sessions" ON public.active_firing_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.active_firing_sessions IS 'Stores active/paused firing sessions for recovery and multi-device access';
COMMENT ON COLUMN public.active_firing_sessions.temperature_entries IS 'JSON array of temperature entries with id, timestamp, temperature, notes, and rampRate';
COMMENT ON COLUMN public.active_firing_sessions.warning_flags IS 'JSON array of warning messages triggered during firing';
COMMENT ON COLUMN public.active_firing_sessions.target_cone IS 'Target cone number (e.g., 04, 06, 10) for pottery firing';
COMMENT ON COLUMN public.active_firing_sessions.is_paused IS 'Whether the firing session is currently paused';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_active_firing_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_update = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_active_firing_sessions_updated_at
    BEFORE UPDATE ON public.active_firing_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_active_firing_sessions_updated_at();

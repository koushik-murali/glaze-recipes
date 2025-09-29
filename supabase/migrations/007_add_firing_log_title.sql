-- Add title column to firing_logs table
DO $$
BEGIN
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
END $$;

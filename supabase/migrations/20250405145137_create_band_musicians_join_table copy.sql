    -- Remove the old JSONB members column from the bands table
    ALTER TABLE public.bands DROP COLUMN IF EXISTS members;

    -- Create the band_musicians join table
    CREATE TABLE public.band_musicians (
        band_id uuid NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
        musician_id uuid NOT NULL REFERENCES public.musicians(id) ON DELETE CASCADE,
        -- Optional: add a timestamp for when the musician joined the band
        -- joined_at timestamptz DEFAULT now(),
        PRIMARY KEY (band_id, musician_id) -- Composite primary key ensures a musician can't be in the same band twice
    );

    -- Optional: Add indexes for performance, although the primary key often covers the main lookup scenarios.
    -- CREATE INDEX idx_band_musicians_band_id ON public.band_musicians(band_id);
    -- CREATE INDEX idx_band_musicians_musician_id ON public.band_musicians(musician_id);


    -- Enable RLS on the join table
    ALTER TABLE public.band_musicians ENABLE ROW LEVEL SECURITY;

    -- Define RLS Policies for the join table

    -- Allow authenticated users to view all band memberships
    -- This is often necessary for Supabase relationship queries to work correctly.
    CREATE POLICY "Allow authenticated read access" ON public.band_musicians
        FOR SELECT
        TO authenticated
        USING (true);

    -- Allow users to add musicians to bands they created
    CREATE POLICY "Allow insert for band creators" ON public.band_musicians
        FOR INSERT
        TO authenticated
        WITH CHECK (
            (SELECT created_by FROM public.bands WHERE id = band_id) = auth.uid()
        );

    -- Allow users to remove musicians from bands they created
    CREATE POLICY "Allow delete for band creators" ON public.band_musicians
        FOR DELETE
        TO authenticated
        USING (
            (SELECT created_by FROM public.bands WHERE id = band_id) = auth.uid()
        );

    -- Note: Update policies are generally not needed for simple join tables unless you add
    -- other columns like 'role' or 'joined_at' that might need updating.
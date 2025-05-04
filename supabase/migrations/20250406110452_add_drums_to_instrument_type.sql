-- Add 'Drums' to the existing instrument_type ENUM
ALTER TYPE public.instrument_type ADD VALUE IF NOT EXISTS 'Drums'; 
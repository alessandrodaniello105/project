/*
  # Create musicians table

  1. New Tables
    - `musicians`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `instrument` (text, not null)
      - `created_at` (timestamp with timezone)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `musicians` table
    - Add policies for authenticated users to:
      - Read all musicians
      - Create their own musicians
      - Update their own musicians
      - Delete their own musicians
*/

CREATE TYPE instrument_type AS ENUM ('Guitar', 'Keys', 'Voice', 'Bass', 'Other');

CREATE TABLE musicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  instrument instrument_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;

CREATE TABLE bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users ON DELETE CASCADE -- Assuming you're using Supabase Auth
);

-- Add a column to store member IDs (many-to-many relationship)
ALTER TABLE bands ADD COLUMN members JSONB; -- JSONB to store an array of musician IDs


-- Allow users to read all musicians
CREATE POLICY "Users can view all musicians"
  ON musicians
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to create their own musicians
CREATE POLICY "Users can create their own musicians"
  ON musicians
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own musicians
CREATE POLICY "Users can update their own musicians"
  ON musicians
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own musicians
CREATE POLICY "Users can delete their own musicians"
  ON musicians
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

  -- Allow users to read all bands
CREATE POLICY "Users can view all bands"
  ON bands
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to create their own bands
CREATE POLICY "Users can create their own bands"
  ON bands
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own bands
CREATE POLICY "Users can update their own bands"
  ON bands
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own bands
CREATE POLICY "Users can delete their own bands"
  ON bands
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);
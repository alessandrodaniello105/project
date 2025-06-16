import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Musician = {
  id: string;
  name: string;
  instrument: 'Guitar' | 'Keys' | 'Voice' | 'Bass' | 'Drums' | 'Other';
  created_at: string;
  user_id: string;
};

export type Band = {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
};

export type BandWithMusicians = Band & {
  musicians: Musician[];
};

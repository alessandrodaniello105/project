import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`
    Missing Supabase credentials!
    Received:
    - URL: ${supabaseUrl ? '*****' : 'MISSING'}
    - KEY: ${supabaseKey ? '*****' : 'MISSING'}
  `)
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Musician, supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const INSTRUMENTS = ['Guitar', 'Keys', 'Voice', 'Bass', 'Drums', 'Other'] as const;

type Props = {
  onMusicianAdded: (musician: Musician) => void;
  userId: string;
};

export function MusicianForm({ onMusicianAdded, userId }: Props) {
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState<Musician['instrument']>('Guitar');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const newMusician: Musician = {
      id: Math.random().toString(36).substring(7),
      name,
      instrument,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    
    onMusicianAdded(newMusician);
    
    // Clear input fields
    setName('');
    setInstrument('Guitar');

    const { data, error } = await supabase.from('musicians')
      .insert({
        name,
        instrument,
        user_id: userId,
      })
      .select();

    if (error) {
      console.error('Error creating musician:', error);
      // Let parent component handle the error
      throw error;
    }
    
    return data[0];
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-center">
      <AnimatePresence initial={false}>
      <motion.div
        layout
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
         className="flex flex-col md:flex-row gap-4 w-full"
      >
        <AnimatePresence initial={false}>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          >
          <label htmlFor="musicianName" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="musicianName"
            autoComplete='false'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md px-2 border-gray-300 leading-[40px] shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </motion.div>
        </AnimatePresence>
        
        <AnimatePresence initial={false}>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }} className="flex-1">
          <label htmlFor="instrument" className="block text-sm font-medium text-gray-700 mb-1">
            Instrument
          </label>
          <select
            id="instrument"
            value={instrument}
            onChange={(e) => setInstrument(e.target.value as Musician['instrument'])}
            className="w-full rounded-md h-10 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {INSTRUMENTS.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </motion.div>
        </AnimatePresence>
      </motion.div>
      </AnimatePresence>

      <AnimatePresence initial={false}>
      <motion.button
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        type="submit"
        className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition flex items-center gap-2"
      >
        <PlusCircle className="w-5 h-5" />
        Add Musician
      </motion.button>
      </AnimatePresence>
    </form>
  );
}
import { useState, useEffect } from 'react';
import { Music2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Musician, supabase } from '../../lib/supabase';
import { MusicianForm } from '../../components/musicians/MusicianForm';
import { MusicianList } from '../../components/musicians/MusicianList';

type Props = {
    session: Session;
}

export function Musicians({ session }: Props) {
  const [musicians, setMusicians] = useState<Musician[]>([]);

  useEffect(() => {
    if (session) {
      fetchMusicians();
    }
  }, [session]);

    async function handleDelete(id: string) {
            
        // remove optimistically
        setMusicians(prevMusicians => prevMusicians.filter(m => m.id !== id));

        const { error } = await supabase.from('musicians').delete().eq('id', id);

        if (error) {
            console.error('Error deleting musician:', error);
            // Rollback: If there's an error, refetch the data.
            fetchMusicians();
        }
    }

  
  async function fetchMusicians() {
    const { data, error } = await supabase
      .from('musicians')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching musicians:', error);
    } else {
      setMusicians(data || []);
    }
  }


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Music2 className="w-6 h-6 text-indigo-600" />
            Musician Manager
          </h1>
          
          <MusicianForm 
            onMusicianAdded={(musician) => setMusicians(prev => [...prev, musician])}
            userId={session.user.id}
          />
        </div>

        <MusicianList 
          musicians={musicians} 
          onDelete={handleDelete}
          onError={() => fetchMusicians()}
        />
      </div>
    </div>
  );
}
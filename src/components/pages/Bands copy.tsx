import { useState, useEffect } from 'react';
import { Music2, Users, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { BandWithMusicians, Musician, supabase } from '../../lib/supabase';
import { BandForm } from '../bands/BandForm';

type Props = {
  session: Session;
};

export function Bands({ session }: Props) {
  const [bands, setBands] = useState<BandWithMusicians[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [expandedBandSections, setExpandedBandSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session) {
      fetchMusicians();
      fetchBands();
    }
  }, [session]);

  async function fetchBands() {
    const { data, error } = await supabase
      .from('bands')
      .select(`
        *,
        musicians (*)
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching bands with musicians:', error);
      setBands([]);
    } else if (data) {
      setBands(data as BandWithMusicians[]);
    } else {
      setBands([]);
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

  async function handleDelete(id: string) {
    const previousBands = bands;
    setBands(prevBands => prevBands.filter(b => b.id !== id));

    const { error } = await supabase.from('bands').delete().eq('id', id);

    if (error) {
      console.error('Error deleting band:', error);
      setBands(previousBands);
    }
  }

  const toggleBandSection = (bandId: string) => {
    setExpandedBandSections((prev) => {
      const next = new Set(prev);
      if (next.has(bandId)) {
        next.delete(bandId);
      } else {
        next.add(bandId);
      }
      return next;
    });
  };

  const sortedBands = [...bands].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Music2 className="w-6 h-6 text-indigo-600" />
            <Users className="w-6 h-6 text-indigo-600" />
            Band Manager
          </h1>

          <BandForm
            onBandAdded={fetchBands}
            userId={session.user.id}
            musicians={musicians}
            bands={bands}
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Bands</h2>

          <div className="space-y-4">
            {sortedBands.map((band) => (
              <div key={band.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleBandSection(band.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">{band.name}</h3>
                    <span className="text-sm text-gray-500">
                      ({band.musicians?.length || 0} musicians)
                    </span>
                  </div>
                  {expandedBandSections.has(band.id) ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {expandedBandSections.has(band.id) && (
                  <div className="divide-y divide-gray-200">
                    {band.musicians?.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 flex items-center justify-between bg-white"
                      >
                        <h4 className="text-lg">{member.name}</h4>
                        <span className="text-sm text-gray-600">{member.instrument}</span>
                      </div>
                    ))}
                    <div className="p-4 flex items-center justify-end bg-white">
                      <button
                        onClick={() => handleDelete(band.id)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    {(band.musicians?.length || 0) === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        No musicians added yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {bands.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                Loading bands or no bands created yet...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { PlusCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { BandWithMusicians, Musician, supabase } from '../../lib/supabase';
import AddBandButton from './addBandButton';


const INSTRUMENTS = ['Guitar', 'Keys', 'Voice', 'Bass', 'Drums', 'Other'] as const;

type Props = {
  onBandAdded: () => void;
  userId: string;
  musicians: Musician[];
  bands: BandWithMusicians[];
};

export function BandForm({ onBandAdded, musicians, bands, userId }: Props) {
  const [name, setName] = useState('');
  const [selectedMusicians, setSelectedMusicians] = useState<Musician['id'][]>([]);
  const [disabledMusicians, setDisabledMusicians] = useState<Set<Musician['id']>>(new Set());
  const [childIsVisible, setChildIsVisible] = useState(true);

  useEffect(() => {
    // Update disabled musicians when selectedMusicians changes
    const newDisabledMusicians = new Set<Musician['id']>();
    const selectedInstruments = new Set<Musician['instrument']>();
    // const addBandButtonRef = useRef(null);


    selectedMusicians.forEach(musicianId => {
      const musician = musicians.find(m => m.id === musicianId);
      if (musician) {
        selectedInstruments.add(musician.instrument);
      }
    });

    musicians.forEach(musician => {
      if (selectedInstruments.has(musician.instrument) && !selectedMusicians.includes(musician.id)) {
        newDisabledMusicians.add(musician.id);
      }
    });

    setDisabledMusicians(newDisabledMusicians);
  }, [selectedMusicians, musicians]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Store name and selected musicians before clearing
    const currentName = name;
    const currentSelectedMusicians = [...selectedMusicians];

    // Clear input fields immediately for better UX
    setName('');
    setSelectedMusicians([]);

    try {
      const { data: bandData, error: bandError } = await supabase
        .from('bands')
        .insert({
          name: currentName, // Use stored name
          created_by: userId,
        })
        .select('id')
        .single(); // Use .single() if you expect exactly one row

      if (bandError) {
        console.error('Error creating band:', bandError);
        // Optional: Add error handling for the user
        // Optional: Restore form fields if needed
        // setName(currentName);
        // setSelectedMusicians(currentSelectedMusicians);
        return; // Stop execution if band creation fails
      }

      // Ensure bandData and bandData.id exist
      if (!bandData || !bandData.id) {
        console.error('Error creating band: No ID returned');
        return;
      }

      const bandId = bandData.id;

      // Only insert members if any were selected
      if (currentSelectedMusicians.length > 0) {
        const bandMembersToInsert = currentSelectedMusicians.map(musicianId => ({
          band_id: bandId,
          musician_id: musicianId,
        }));

        const { error: bandMembersError } = await supabase
          .from('band_musicians')
          .insert(bandMembersToInsert);

        if (bandMembersError) {
          console.error('Error creating band members:', bandMembersError);
          // More robust error handling could involve deleting the created band
          // or notifying the user that members weren't added.
          // For now, we'll proceed but the band might exist without members.
        }
      }

      // Call onBandAdded HERE, after all database operations are successful
      onBandAdded(); // No need to pass data, fetchBands gets it all

    } catch (error) {
      console.error('Unexpected error during band submission:', error);
      // Optional: Restore form fields or show generic error to user
    }
  }

  const handleMusicianSelect = (musicianId: Musician['id']) => {
    setSelectedMusicians((prev) => {
      if (prev.includes(musicianId)) {
        return prev.filter((id) => id !== musicianId);
      } else {
        return [...prev, musicianId];
      }
    });
  };

  // Get IDs of musicians in other bands
  const musiciansInBands = new Set<Musician['id']>();
  bands.forEach(band => {
    band.musicians?.forEach(member => musiciansInBands.add(member.id));
  });

  // Group musicians by instrument and then by availability
  const groupedMusicians = INSTRUMENTS.reduce((acc, inst) => {
    const instrumentMusicians = musicians.filter(m => m.instrument === inst);
    const available = instrumentMusicians.filter(m => !musiciansInBands.has(m.id));
    const busy = instrumentMusicians.filter(m => musiciansInBands.has(m.id));
    acc[inst] = { available, busy };
    return acc;
  }, {} as Record<Musician['instrument'], { available: Musician[], busy: Musician[] }>);

  const handleVisibility = useCallback((visible: boolean) => {
    setChildIsVisible(visible);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label
            htmlFor="bandName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Band Name
          </label>
          <input
            type="text"
            id="bandName"
            value={name}
            autoComplete='false'
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md leading-[40px] px-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <AddBandButton onVisibilityChange={handleVisibility} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition flex items-center gap-2" />
      </div>

      {/* Sticky AddBandButton for when main button is not visible */}
      {!childIsVisible && (
        <div className="fixed bottom-4 left-0 w-full flex justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <AddBandButton className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg" />
          </div>
        </div>
      )}

      {/* Group by instrument */}
      {INSTRUMENTS.map((instrument) => (
        <div key={instrument}>
          <h3 className="text-lg font-semibold mb-2">{instrument}</h3>

          {/* Available Musicians */}
          {groupedMusicians[instrument].available.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {groupedMusicians[instrument].available.map((musician) => (
                <label
                  key={musician.id}
                  className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer ${
                    selectedMusicians.includes(musician.id)
                      ? 'bg-indigo-100 border-indigo-500'
                      : 'border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={musician.id}
                    id={musician.id}
                    checked={selectedMusicians.includes(musician.id)}
                    onChange={() => handleMusicianSelect(musician.id)}
                    disabled={disabledMusicians.has(musician.id)}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                  />
                  <span>{musician.name}</span>
                </label>
              ))}
            </div>
          )}

          {/* Busy Musicians */}
          {groupedMusicians[instrument].busy.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {groupedMusicians[instrument].busy.map((musician) => (
                <div
                  key={musician.id}
                  className="flex items-center gap-2 p-2 border rounded-md border-gray-300 bg-gray-100"
                >
                  <input
                    type="checkbox"
                    value={musician.id}
                    id= {musician.id}
                    disabled
                    className="form-checkbox h-4 w-4 text-gray-400"
                  />
                  <span className="text-gray-500">{musician.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* No Musicians */}
          {groupedMusicians[instrument].available.length === 0 && groupedMusicians[instrument].busy.length === 0 && (
            <p className="text-gray-500 mb-4">No {instrument.toLowerCase()} players.</p>
          )}
        </div>
      ))}
    </form>
  );
}

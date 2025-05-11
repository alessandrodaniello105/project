import React, { useState, useEffect, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { BandWithMusicians, Musician, supabase } from '../../lib/supabase';
import { Shuffle } from 'lucide-react';

// Define available instruments (consider importing from a shared location if used elsewhere)
const INSTRUMENTS = ['Guitar', 'Keys', 'Voice', 'Bass', 'Drums', 'Other'] as const;
type Instrument = typeof INSTRUMENTS[number];

type Props = {
  session: Session;
};

export function RandomBands({ session }: Props) {
  const [bandName, setBandName] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState<Set<Instrument>>(new Set());
  const [allMusicians, setAllMusicians] = useState<Musician[]>([]);
  const [existingBands, setExistingBands] = useState<BandWithMusicians[]>([]); // Needed to find available musicians
  // const [howManyBands, setHowManyBands] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [numberOfBandsToGenerate, setNumberOfBandsToGenerate] = useState<number>(2); // Default to 2

  // Fetch all musicians and existing bands on component mount
  useEffect(() => {
    if (session) {
      fetchAllMusicians();
      fetchExistingBands();
    }
  }, [session]);

  async function fetchAllMusicians() {
    const { data, error } = await supabase
      .from('musicians')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching musicians:', error);
      setMessage({ type: 'error', text: 'Could not load musicians.' });
    } else {
      setAllMusicians(data || []);
    }
  }

  async function fetchExistingBands() {
    // Fetch bands with their musicians to know who is busy
    const { data, error } = await supabase
      .from('bands')
      .select('*, musicians(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bands:', error);
      setMessage({ type: 'error', text: 'Could not load existing band data.' });
    } else {
      setExistingBands(data || []);
    }
  }

  // --- Calculate Availability using useMemo ---
  const busyMusicianIds = useMemo(() => {
    const ids = new Set<string>();
    existingBands.forEach(band => {
      band.musicians?.forEach(musician => ids.add(musician.id));
    });
    return ids;
  }, [existingBands]);

  const instrumentAvailability = useMemo(() => {
    const availability = new Map<Instrument, boolean>();
    for (const instrument of INSTRUMENTS) {
      const hasAvailable = allMusicians.some(
        m => m.instrument === instrument && !busyMusicianIds.has(m.id)
      );
      availability.set(instrument, hasAvailable);
    }
    return availability;
  }, [allMusicians, busyMusicianIds]);
  // --- End of Availability Calculation ---

  const handleInstrumentChange = (instrument: Instrument) => {
    setSelectedInstruments(prev => {
      const next = new Set(prev);
      if (next.has(instrument)) {
        next.delete(instrument);
      } else {
        next.add(instrument);
      }
      return next;
    });
  };

  const handleMultipleRandomize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // --- 1. Input Validation ---
    const bandsToAttempt = numberOfBandsToGenerate; // We already enforce min/max in the input UI
    if (bandsToAttempt < 2) {
      // This check is mostly redundant due to input constraint but good for safety
      setMessage({ type: 'error', text: 'Currently, only generating exactly 2 bands is supported by the rules.' });
      setIsLoading(false);
      return;
    }

    // --- 2. Calculate Available Musicians ---
    const availableMusicians = allMusicians.filter(m => !busyMusicianIds.has(m.id));
    const availableDrummers = availableMusicians.filter(m => m.instrument === 'Drums');
    const availableOthers = availableMusicians.filter(m => m.instrument !== 'Drums');

    // Group available others by instrument
    const availableOthersByInstrument = new Map<Instrument, Musician[]>();
    availableOthers.forEach(m => {
      if (!availableOthersByInstrument.has(m.instrument)) {
        availableOthersByInstrument.set(m.instrument, []);
      }
      availableOthersByInstrument.get(m.instrument)?.push(m);
    });

    // --- 3. Check Core Rule ---
    const distinctAvailableOtherInstruments = availableOthersByInstrument.size;
    const canProceed = availableDrummers.length >= 2 && distinctAvailableOtherInstruments >= 3;

    if (!canProceed) {
      setMessage({
        type: 'error',
        text: `Cannot generate ${bandsToAttempt} bands. Requires at least 2 available drummers (found ${availableDrummers.length}) and 3 other available musicians with different instruments (found ${distinctAvailableOtherInstruments}).`
      });
      setIsLoading(false);
      return;
    }

    // --- 4. Select Musicians for 2 Bands ---
    const shuffledDrummers = shuffleArray(availableDrummers);
    const selectedDrummers = [shuffledDrummers[0], shuffledDrummers[1]];

    // Select 3 distinct other instruments randomly
    const otherInstrumentKeys = shuffleArray(Array.from(availableOthersByInstrument.keys()));
    const selectedOtherInstruments = otherInstrumentKeys.slice(0, 3);

    // Select one musician for each chosen instrument
    const selectedOthers: Musician[] = [];
    try {
        selectedOtherInstruments.forEach(instrument => {
            const musiciansForInstrument = availableOthersByInstrument.get(instrument);
            if (!musiciansForInstrument || musiciansForInstrument.length === 0) {
                 // This shouldn't happen if the initial check passed, but safeguard
                throw new Error(`No available musicians found for ${instrument} during selection.`);
            }
            const shuffledMusicians = shuffleArray(musiciansForInstrument);
            selectedOthers.push(shuffledMusicians[0]);
        });
    } catch (error) {
        console.error("Error selecting 'other' musicians:", error);
        setMessage({ type: 'error', text: `Error selecting musicians: ${error instanceof Error ? error.message : 'Unknown error'}.` });
        setIsLoading(false);
        return;
    }


    // Define the bands structure
    let bandsToCreateData: { name: string; musicians: Musician[] }[] = [];
    // const timestamp = Date.now(); // For unique band names (no longer needed)

    if (bandsToAttempt === 2) {
      bandsToCreateData = [
        { name: generateBandName(0), musicians: [selectedDrummers[0], selectedOthers[0], selectedOthers[1]] },
        { name: generateBandName(1), musicians: [selectedDrummers[1], selectedOthers[2]] }
      ];

    } else { // bandsToAttempt >= 3
      for (let i = 0; i < bandsToAttempt; i++) {
        bandsToCreateData.push({
          name: generateBandName(i),
          musicians: [selectedDrummers[i], selectedOthers[i]]
        });
      }
    }

    // --- 5. Database Operations ---
    const createdBandNames: string[] = [];
    try {
      for (const bandInfo of bandsToCreateData) {
        // Insert Band
        const { data: bandData, error: bandError } = await supabase
          .from('bands')
          .insert({ name: bandInfo.name, created_by: session.user.id })
          .select('id')
          .single();

        if (bandError) throw new Error(`Failed to create band "${bandInfo.name}": ${bandError.message}`);
        if (!bandData || !bandData.id) throw new Error(`Failed to create band "${bandInfo.name}" (no ID).`);

        const bandId = bandData.id;
        createdBandNames.push(bandInfo.name); // Track successful creations

        // Insert Members
        const bandMembersToInsert = bandInfo.musicians.map(musician => ({
          band_id: bandId,
          musician_id: musician.id,
        }));

        const { error: bandMembersError } = await supabase
          .from('band_musicians')
          .insert(bandMembersToInsert);

        if (bandMembersError) throw new Error(`Band "${bandInfo.name}" created, but failed to add members: ${bandMembersError.message}`);
      }

      // Success!
      setMessage({ type: 'success', text: `Successfully created ${createdBandNames.length} bands: ${createdBandNames.join(', ')}!` });
      fetchExistingBands(); // Refresh the list to show new bands and update availability

    } catch (error: unknown) {
      console.error('Error during multiple band creation:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      // Attempt to clean up if partial creation happened? (Difficult without transactions)
      // For now, just report the error and which bands *might* have been created.
      setMessage({ type: 'error', text: `Error creating bands: ${errorMessage}. ${createdBandNames.length > 0 ? `Successfully created: ${createdBandNames.join(', ')}.` : ''}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const trimmedBandName = bandName.trim();

    if (selectedInstruments.size === 0) {
      setMessage({ type: 'error', text: 'Please select at least one instrument.' });
      setIsLoading(false);
      return;
    }

    if (!trimmedBandName) {
      setMessage({ type: 'error', text: 'Please enter a band name.' });
      setIsLoading(false);
      return;
    }

    // Busy musicians already calculated in useMemo
    const selectedMusicianIds: string[] = [];
    let possible = true;

    for (const instrument of selectedInstruments) {
      // Use pre-calculated availability map for check
      if (!instrumentAvailability.get(instrument)) {
         setMessage({ type: 'error', text: `Cannot select ${instrument} as no musicians are available.` });
         possible = false;
         break;
      }
      // Filter available musicians for the current instrument
      const availableForInstrument = allMusicians.filter(
        m => m.instrument === instrument && !busyMusicianIds.has(m.id)
      );
      // This check should technically be redundant now due to the map check above, but safe to keep
      if (availableForInstrument.length === 0) {
         setMessage({ type: 'error', text: `No available musicians found for ${instrument}.` });
         possible = false;
         break; 
      }
      const randomIndex = Math.floor(Math.random() * availableForInstrument.length);
      selectedMusicianIds.push(availableForInstrument[randomIndex].id);
    }
    
    if (!possible) {
      setIsLoading(false);
      return; 
    }

    try {
      // Insert Band
      const { data: bandData, error: bandError } = await supabase
        .from('bands')
        .insert({ name: trimmedBandName, created_by: session.user.id })
        .select('id')
        .single();

      if (bandError) {
        console.error('Error creating band:', bandError);
        setMessage({ type: 'error', text: `Failed to create band: ${bandError.message}` });
        setIsLoading(false);
        return;
      }

      if (!bandData || !bandData.id) {
        console.error('Error creating band: No ID returned');
        setMessage({ type: 'error', text: 'Failed to create band (no ID returned).' });
        setIsLoading(false);
        return;
      }

      const bandId = bandData.id;

      // Insert Members
      if (selectedMusicianIds.length > 0) {
        const bandMembersToInsert = selectedMusicianIds.map(musicianId => ({
          band_id: bandId,
          musician_id: musicianId,
        }));

        const { error: bandMembersError } = await supabase
          .from('band_musicians')
          .insert(bandMembersToInsert);

        if (bandMembersError) {
          console.error('Error creating band members:', bandMembersError);
          setMessage({ type: 'error', text: `Band created, but failed to add members: ${bandMembersError.message}` });
          setIsLoading(false);
          return;
        }
      }

      // Success!
      setMessage({ type: 'success', text: `Successfully created band "${trimmedBandName}" with ${selectedMusicianIds.length} random members!` });
      setBandName(''); 
      setSelectedInstruments(new Set());
      fetchExistingBands(); 

    } catch (error: unknown) {
      console.error('Unexpected error during band randomization:', error);
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
        errorMessage = `An unexpected error occurred: ${error.message}`;
      }
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shuffle className="w-6 h-6 text-indigo-600" />
          Single Band Random Generator
        </h1>

        {message && (
          <div className={`p-4 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleRandomize} className="space-y-6">
          {/* Band Name Input */}
          <div>
            <label
              htmlFor="bandName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Band Name
            </label>
            <input
              type="text"
              id="bandName"
              value={bandName}
              autoComplete='false'
              onChange={(e) => setBandName(e.target.value)}
              className="w-full leading-[40px] px-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., The Cosmic Coders"
              required
            />
          </div>

          {/* Instrument Selection */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Select Instruments for the Band (Only available instruments are shown)
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INSTRUMENTS.map((instrument) => {
                 // Check availability using the memoized map
                 const isAvailable = instrumentAvailability.get(instrument) ?? false;
                 return (
                  <label
                    key={instrument}
                    className={`flex items-center gap-2 p-3 border rounded-md transition ${ 
                      !isAvailable
                       ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' // Disabled style
                       : selectedInstruments.has(instrument)
                         ? 'bg-indigo-100 border-indigo-500 cursor-pointer' // Selected style
                         : 'border-gray-300 hover:bg-gray-50 cursor-pointer' // Default style
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={instrument}
                      checked={selectedInstruments.has(instrument)}
                      onChange={() => handleInstrumentChange(instrument)}
                      // Disable checkbox if not available
                      disabled={!isAvailable}
                      className={`form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 ${!isAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    />
                    <span className="flex items-center gap-1">
                       {instrument} 
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Randomizing...
                </>
              ) : (
                <>
                  <Shuffle className="w-5 h-5" />
                  Generate Random Band
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 my-5">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shuffle className="w-6 h-6 text-indigo-600" />
          Multiple Band Random Generator
        </h1>

        {message && (
          <div className={`p-4 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleMultipleRandomize} className="space-y-6 border-t pt-6 mt-6 border-gray-200">
          <div>
            <label
              htmlFor="bandCount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Number of Bands to Generate (Max 2, requires `&gt;`=2 Drummers & `&gt;`=3 Others)
            </label>

            <input
              type="number"
              id="bandCount"
              value={numberOfBandsToGenerate}
              onChange={(e) => setNumberOfBandsToGenerate(Math.max(2, parseInt(e.target.value, 10) || 2))} // Ensure min 2
              min="2" // Hardcoded max based on rule
              className="w-full leading-[40px] px-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <Shuffle className="w-5 h-5" />
                  Generate Multiple Bands
                </>
              )}
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to generate a random band name like 'Band 1', 'Band 2', etc.
function generateBandName(index: number) {
  return `Band ${index + 1}`;
} 
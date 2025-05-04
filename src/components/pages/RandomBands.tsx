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
    
    const trimmedBandName = bandName.trim();
    
    if (!trimmedBandName) {
      setMessage({ type: 'error', text: 'Please enter a band name.' });
      setIsLoading(false);
      return;
    }

    console.log(instrumentAvailability);
  
  }

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

        <form onSubmit={handleMultipleRandomize} className="space-y-6">
          {/* Band Name Input */}
          {/* <div>
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
          </div> */}

          {/* Instrument Selection */}
          {/* <div>
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
          </div> */}

          <div>
            {/* Choose how many bands do you want to generate randomically */}
            <label
              htmlFor="bandCount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              How many bands do you want to generate randomically?
            </label>

            <input type="text" id="bandCount" className="w-full leading-[40px] px-2" />


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



    </div>
  );
} 